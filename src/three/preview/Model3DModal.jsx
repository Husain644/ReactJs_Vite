import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Box3, Sphere, Spherical, Vector3 } from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { useGLTFWeb } from "./useGLTFWeb";
import { uploadFileToR2 } from "../api/contentApi";

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);

// Direct port of SceneModel.jsx: only ever returns Three.js-valid JSX or
// null (never a DOM element) — required since this renders inside <Canvas>.
function SceneModel({
  modelUrl,
  materialConfig = EMPTY_OBJECT,
  animations = EMPTY_ARRAY,
  onMeshPress,
  onLoad,
  onError,
  onFramed,
}) {
  const meshRefs = useRef({});
  const { gl } = useThree();

  const { scene, ready, error } = useGLTFWeb(modelUrl, gl);

  useEffect(() => {
    if (error) {
      onError?.(error);
      return;
    }

    if (ready) {
      onLoad?.();
    }
  }, [ready, error, onLoad, onError]);

  const clonedScene = useMemo(() => {
    if (!scene || !ready || error) return null;

    try {
      const clone = SkeletonUtils.clone(scene);

      meshRefs.current = {};

      let meshCount = 0;

      clone.traverse((child) => {
        if (!child.isMesh) return;

        meshCount++;

        meshRefs.current[child.name] = child;

        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          child.material = child.material.clone();

          const config = materialConfig[child.name];

          if (config) {
            Object.assign(child.material, config);
          }
        }
      });

      console.log("Model Loaded");
      console.log("Meshes:", meshCount);

      return clone;
    } catch (e) {
      console.error(e);
      onError?.(e);
      return null;
    }
  }, [scene, ready, error, materialConfig, onError]);

  useEffect(() => {
    if (clonedScene) {
      onFramed?.(clonedScene);
    }
  }, [clonedScene, onFramed]);

  useFrame((_, delta) => {
    if (!animations.length) return;

    animations.forEach((anim) => {
      const mesh = meshRefs.current[anim.name];

      if (!mesh) return;

      mesh.rotation.x += (anim.rotateX || 0) * delta;
      mesh.rotation.y += (anim.rotateY || 0) * delta;
      mesh.rotation.z += (anim.rotateZ || 0) * delta;
    });
  });

  if (!clonedScene) return null;

  return (
    <primitive
      object={clonedScene}
      onClick={(e) => {
        e.stopPropagation();
        onMeshPress?.(e.object.name, e);
      }}
    />
  );
}

// Positions the camera to frame the model once its bounds are known —
// plain three.js Box3 math, no dependency on any wrapper's auto-fit.
// `skipPositioning`: when a saved cameraAngle already placed the camera
// (see Model3DModal below), we still want correct near/far clipping for
// this model's size, but must NOT recenter/reposition — that would
// clobber the user's saved angle the instant the model finishes loading.
// `onBounds`: reports the bounding-sphere radius up to the parent so it
// can size the zoom slider's range to this specific model — pass a
// stable setState function here, not an inline arrow, or this effect
// will re-run (and re-frame the camera) on every unrelated re-render.
function CameraFramer({ target, skipPositioning, onBounds }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!target) return;

    const box = new Box3().setFromObject(target);

    if (box.isEmpty()) return;

    const sphere = new Sphere();

    box.getBoundingSphere(sphere);

    const center = sphere.center;
    const radius = sphere.radius || 1;

    camera.near = Math.max(radius / 100, 0.01);
    camera.far = radius * 100;

    onBounds?.(radius);

    if (!skipPositioning) {
      const fov = (camera.fov * Math.PI) / 180;

      const distance = radius / Math.sin(fov / 2);

      camera.position.set(
        center.x + distance,
        center.y + distance * 0.4,
        center.z + distance
      );

      camera.lookAt(center);
    }

    camera.updateProjectionMatrix();

    console.log("Camera Framed");
  }, [target, camera, skipPositioning, onBounds]);

  return null;
}

function Loader3D() {
  return (
    <mesh>
      <sphereGeometry args={[0.4, 12, 12]} />
      <meshBasicMaterial wireframe color="#94a3b8" />
    </mesh>
  );
}

export default function Model3DModal({
  url,
  title,
  subtitle,
  cameraAngle,
  onClose,
  onCaptured,
  onSaveCamera,
}) {
  const [status, setStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  const [framedScene, setFramedScene] = useState(null);

  // Holds the live WebGLRenderer/camera/OrbitControls once <Canvas> mounts
  // them (via onCreated / ref below), so the header buttons and the
  // rotate/zoom sliders — all outside <Canvas> — have something to read
  // from and drive.
  const glRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  // A previously-saved [x, y, z] camera position, if any. When present we
  // use it as the Canvas's initial camera position AND tell CameraFramer
  // not to auto-fit/recenter once the model loads, so the saved angle
  // sticks instead of being overwritten the instant the GLB is ready.
  const hasSavedCameraAngle =
    Array.isArray(cameraAngle) && cameraAngle.length === 3 && cameraAngle.every((n) => Number.isFinite(n));
  const initialCameraPosition = useMemo(
    () => (hasSavedCameraAngle ? cameraAngle : [3, 3, 5]),
    // Intentionally only computed once per modal open — mutating this on
    // every render would fight the user's own orbiting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // 'idle' | 'capturing' | 'uploading' | 'saving' | 'done' | 'error'
  const [captureStatus, setCaptureStatus] = useState("idle");
  const [captureError, setCaptureError] = useState(null);
  // Set only if the upload succeeded but the subsequent field-save (PATCH)
  // failed — kept separate from captureError so a successful upload isn't
  // hidden behind a "capture failed" message when only the save step broke.
  const [saveError, setSaveError] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);

  // 'idle' | 'saving' | 'done' | 'error'
  const [cameraSaveStatus, setCameraSaveStatus] = useState("idle");
  const [cameraSaveError, setCameraSaveError] = useState(null);

  // ---- No-mouse rotate/zoom sliders ----
  // Mirror of OrbitControls' own drag/scroll behaviour, expressed as plain
  // spherical coordinates around controls.target: azimuth (left/right),
  // polar (up/down tilt), and radius (zoom distance). Kept in sync in
  // both directions — dragging with a mouse (if one exists) updates the
  // sliders via OrbitControls' onChange below, and moving a slider drives
  // the camera directly, same as a drag would.
  const [azimuthDeg, setAzimuthDeg] = useState(45);
  const [polarDeg, setPolarDeg] = useState(60);
  const [zoomDistance, setZoomDistance] = useState(5);
  const [zoomBounds, setZoomBounds] = useState({ min: 1, max: 20 });
  // True only while we're applying a slider-driven update, so the
  // OrbitControls onChange it triggers doesn't fight the slider's own
  // in-progress value.
  const applyingFromSliderRef = useRef(false);

  const handleBounds = useCallback((radius) => {
    setZoomBounds({ min: Math.max(radius * 0.4, 0.05), max: radius * 6 });
  }, []);

  const applySpherical = useCallback((azDeg, polDeg, distance) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    applyingFromSliderRef.current = true;

    const spherical = new Spherical(distance, (polDeg * Math.PI) / 180, (azDeg * Math.PI) / 180);
    spherical.makeSafe();

    const offset = new Vector3().setFromSpherical(spherical);
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();

    applyingFromSliderRef.current = false;
  }, []);

  // Reads the camera's current position back into the sliders — called
  // once the model has loaded/framed, and again whenever the user drags
  // with a mouse/touch so the sliders never fall out of sync with reality.
  const syncSlidersFromCamera = useCallback(() => {
    if (applyingFromSliderRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const offset = new Vector3().copy(camera.position).sub(controls.target);
    const spherical = new Spherical().setFromVector3(offset);

    setAzimuthDeg(Math.round((spherical.theta * 180) / Math.PI));
    setPolarDeg(Math.round((spherical.phi * 180) / Math.PI));
    setZoomDistance(Math.round(spherical.radius * 1000) / 1000);
  }, []);

  const handleAzimuthChange = useCallback(
    (e) => {
      const val = Number(e.target.value);
      setAzimuthDeg(val);
      applySpherical(val, polarDeg, zoomDistance);
    },
    [applySpherical, polarDeg, zoomDistance]
  );

  const handlePolarChange = useCallback(
    (e) => {
      const val = Number(e.target.value);
      setPolarDeg(val);
      applySpherical(azimuthDeg, val, zoomDistance);
    },
    [applySpherical, azimuthDeg, zoomDistance]
  );

  // Zoom slider is shown inverted (left = zoomed out, right = zoomed in)
  // since that's the intuitive direction, even though it's driving a
  // "distance" value where smaller = closer.
  const zoomRange = zoomBounds.max - zoomBounds.min || 1;
  const zoomSliderValue = Math.round(((zoomBounds.max - zoomDistance) / zoomRange) * 100);

  const handleZoomSliderChange = useCallback(
    (e) => {
      const val = Number(e.target.value);
      const next = zoomBounds.max - (val / 100) * zoomRange;
      setZoomDistance(next);
      applySpherical(azimuthDeg, polarDeg, next);
    },
    [applySpherical, azimuthDeg, polarDeg, zoomBounds, zoomRange]
  );

  const stepZoom = useCallback(
    (direction) => {
      const next = Math.min(zoomBounds.max, Math.max(zoomBounds.min, zoomDistance - direction * zoomRange * 0.08));
      setZoomDistance(next);
      applySpherical(azimuthDeg, polarDeg, next);
    },
    [applySpherical, azimuthDeg, polarDeg, zoomBounds, zoomRange, zoomDistance]
  );

  // Once the model has loaded AND been auto-framed (or positioned from a
  // saved cameraAngle), read the resulting camera position into the
  // sliders so they start out matching what's on screen.
  useEffect(() => {
    if (status !== "ready" || !framedScene) return;
    const id = requestAnimationFrame(syncSlidersFromCamera);
    return () => cancelAnimationFrame(id);
  }, [status, framedScene, syncSlidersFromCamera]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleLoad = useCallback(() => setStatus("ready"), []);
  const handleError = useCallback((err) => {
    setError(err);
    setStatus("error");
  }, []);

  // Three-stage pipeline: (1) capture the current frame off the canvas,
  // (2) upload it to R2, (3) if a save target was given (edit mode),
  // PATCH just that one `thumbnail` field via onCaptured — never the
  // whole document. Stage 3 failing doesn't lose the upload: the URL is
  // still shown/copyable, only the auto-save didn't go through.
  //
  // Capture itself needs `preserveDrawingBuffer: true` on the Canvas's GL
  // context below, or toBlob() can come back with a blank/transparent
  // frame on some GPUs since the drawing buffer is otherwise cleared
  // right after it's presented.
  const handleCapture = useCallback(async () => {
    const gl = glRef.current;
    if (!gl || status !== "ready" || captureStatus === "capturing" || captureStatus === "uploading" || captureStatus === "saving") {
      return;
    }

    setCaptureStatus("capturing");
    setCaptureError(null);
    setSaveError(null);

    let uploadedUrl = null;

    try {
      const blob = await new Promise((resolve, reject) => {
        gl.domElement.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas capture returned no image data"));
        }, "image/png");
      });

      const file = new File([blob], `scene-capture-${Date.now()}.png`, { type: "image/png" });

      setCaptureStatus("uploading");
      const result = await uploadFileToR2(file, "scene-captures");
      uploadedUrl = result.url;
      setCapturedUrl(uploadedUrl);
    } catch (err) {
      setCaptureError(err.message || String(err));
      setCaptureStatus("error");
      return;
    }

    if (!onCaptured) {
      setCaptureStatus("done");
      return;
    }

    try {
      setCaptureStatus("saving");
      await onCaptured(uploadedUrl);
      setCaptureStatus("done");
    } catch (err) {
      setSaveError(err.message || String(err));
      setCaptureStatus("done");
    }
  }, [status, captureStatus, onCaptured]);

  // Reads the live camera's current position (wherever the user has
  // orbited/zoomed it to) and hands it to onSaveCamera, which PATCHes
  // just `modelConfig.cameraAngle` — same one-field-at-a-time pattern as
  // the thumbnail capture above.
  const handleSaveCamera = useCallback(async () => {
    const camera = cameraRef.current;
    if (!camera || status !== "ready" || !onSaveCamera || cameraSaveStatus === "saving") {
      return;
    }

    const position = [camera.position.x, camera.position.y, camera.position.z].map(
      (n) => Math.round(n * 1000) / 1000
    );

    setCameraSaveStatus("saving");
    setCameraSaveError(null);

    try {
      await onSaveCamera(position);
      setCameraSaveStatus("done");
    } catch (err) {
      setCameraSaveError(err.message || String(err));
      setCameraSaveStatus("error");
    }
  }, [status, cameraSaveStatus, onSaveCamera]);


  return (
    <div className="pv-3d-modal-overlay" onClick={onClose}>
      <div className="pv-3d-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pv-3d-modal__header">
          <div>
            {title && <div className="pv-3d-modal__title">{title}</div>}
            {subtitle && <div className="pv-3d-modal__subtitle">{subtitle}</div>}
          </div>
          <div className="pv-3d-modal__header-actions">
            <button
              className="pv-3d-modal__capture"
              onClick={handleCapture}
              disabled={
                status !== "ready" ||
                captureStatus === "capturing" ||
                captureStatus === "uploading" ||
                captureStatus === "saving"
              }
              aria-label="Capture scene"
              title="Capture the current view as an image"
            >
              {captureStatus === "capturing" && "Capturing…"}
              {captureStatus === "uploading" && "Uploading…"}
              {captureStatus === "saving" && "Saving…"}
              {(captureStatus === "idle" || captureStatus === "done" || captureStatus === "error") && (
                <>📷 Capture</>
              )}
            </button>
            {onSaveCamera && (
              <button
                className="pv-3d-modal__capture"
                onClick={handleSaveCamera}
                disabled={status !== "ready" || cameraSaveStatus === "saving"}
                aria-label="Save camera angle"
                title="Save the current camera angle for this model"
              >
                {cameraSaveStatus === "saving" ? "Saving…" : <>🎥 Save Camera</>}
              </button>
            )}
            <button className="pv-3d-modal__close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="pv-3d-modal__canvas">
          <Canvas
  shadows
  dpr={[1, 2]}
  gl={{ preserveDrawingBuffer: true }}
  onCreated={(state) => {
    glRef.current = state.gl;
    cameraRef.current = state.camera;
  }}
  camera={{
    fov: 45,
    near: 0.01,
    far: 10000,
    position: initialCameraPosition,
  }}
>


            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 8, 5]} intensity={1.1} />
            <directionalLight position={[-5, -3, -5]} intensity={0.35} />
            {status === "loading" && <Loader3D />}
            <SceneModel
              modelUrl={url}
              onLoad={handleLoad}
              onError={handleError}
              onFramed={setFramedScene}
            />
            {framedScene && (
              <CameraFramer target={framedScene} skipPositioning={hasSavedCameraAngle} onBounds={handleBounds} />
            )}
            <OrbitControls
              ref={controlsRef}
              makeDefault
              enableDamping
              dampingFactor={0.08}
              onChange={syncSlidersFromCamera}
            />
          </Canvas>

          {/* Loading/error overlays sit OUTSIDE <Canvas> — plain DOM, safe */}
          {status === "loading" && (
            <div className="pv-3d-modal__loading" style={{ pointerEvents: "none" }}>
              <div className="pv-3d-modal__spinner" />
              <div>Loading 3D model…</div>
            </div>
          )}
          {status === "error" && (
            <div className="pv-3d-modal__error">
              <div className="pv-3d-modal__error-icon">⚠</div>
              <div>Couldn't load this 3D model.</div>
              <div className="pv-3d-modal__error-detail">{error?.message || String(error)}</div>
              <div className="pv-3d-modal__error-url">{url}</div>
            </div>
          )}
        </div>

        {captureStatus === "done" && capturedUrl && (
          <div className="pv-3d-modal__capture-result">
            <img className="pv-3d-modal__capture-result-thumb" src={capturedUrl} alt="Captured thumbnail" />
            <div className="pv-3d-modal__capture-result-body">
              <span className="pv-3d-modal__capture-result-label">
                {saveError ? "Uploaded" : onCaptured ? "Saved as thumbnail" : "Captured"}
              </span>
              <code className="pv-3d-modal__capture-result-url" title={capturedUrl}>
                {capturedUrl}
              </code>
            </div>
            <button
              type="button"
              className="pv-3d-modal__capture-copy"
              onClick={() => navigator.clipboard.writeText(capturedUrl)}
            >
              Copy
            </button>
          </div>
        )}
        {saveError && (
          <div className="pv-3d-modal__capture-error">
            Image uploaded, but saving it as the thumbnail failed: {saveError}
          </div>
        )}
        {captureStatus === "error" && (
          <div className="pv-3d-modal__capture-error">Capture failed: {captureError}</div>
        )}
        {cameraSaveStatus === "done" && (
          <div className="pv-3d-modal__capture-result">
            <span className="pv-3d-modal__capture-result-label">🎥 Camera angle saved</span>
          </div>
        )}
        {cameraSaveStatus === "error" && (
          <div className="pv-3d-modal__capture-error">Saving camera angle failed: {cameraSaveError}</div>
        )}

        {status === "ready" && (
          <div className="pv-3d-modal__hint pv-3d-modal__hint--with-controls">
            <span className="pv-3d-modal__hint-text">Drag to rotate · Scroll to zoom</span>
            <div className="pv-3d-modal__controls">
              <div className="pv-3d-modal__control">
                <span className="pv-3d-modal__control-icon" aria-hidden="true">↺</span>
                <input
                  type="range"
                  className="pv-3d-modal__slider"
                  min={-180}
                  max={180}
                  step={1}
                  value={azimuthDeg}
                  onChange={handleAzimuthChange}
                  aria-label="Rotate horizontally"
                />
              </div>
              <div className="pv-3d-modal__control">
                <span className="pv-3d-modal__control-icon" aria-hidden="true">↕</span>
                <input
                  type="range"
                  className="pv-3d-modal__slider"
                  min={5}
                  max={175}
                  step={1}
                  value={polarDeg}
                  onChange={handlePolarChange}
                  aria-label="Tilt vertically"
                />
              </div>
              <div className="pv-3d-modal__control">
                <button
                  type="button"
                  className="pv-3d-modal__zoom-btn"
                  onClick={() => stepZoom(-1)}
                  aria-label="Zoom out"
                >
                  −
                </button>
                <input
                  type="range"
                  className="pv-3d-modal__slider"
                  min={0}
                  max={100}
                  step={1}
                  value={zoomSliderValue}
                  onChange={handleZoomSliderChange}
                  aria-label="Zoom"
                />
                <button
                  type="button"
                  className="pv-3d-modal__zoom-btn"
                  onClick={() => stepZoom(1)}
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
        {status !== "ready" && <div className="pv-3d-modal__hint">Drag to rotate · Scroll to zoom</div>}
      </div>
    </div>
  );
}
