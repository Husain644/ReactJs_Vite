import { useEffect, useState } from "react";
import { LoadingManager } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";


let decoderReady = false;
let ktx2Loader = null;
const cache = {};

function getKTX2Loader(renderer) {
  if (!renderer) return null;
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath("/basis/");
  }
  ktx2Loader.detectSupport(renderer);
  return ktx2Loader;
}

export function useGLTFWeb(url, renderer) {
  const [state, setState] = useState({
    nodes: {},
    materials: {},
    animations: [],
    scene: null,
    ready: false,
    error: null,
  });

  useEffect(() => {
    if (!url) return;

    if (cache[url]) {
      setState(cache[url]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        if (!decoderReady) {
          await MeshoptDecoder.ready;
          decoderReady = true;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} fetching model: ${res.statusText}`);
        }
        const buffer = await res.arrayBuffer();

        const manager = new LoadingManager();
        const loader = new GLTFLoader(manager);
        loader.meshoptDecoder = MeshoptDecoder;

        const ktx2 = getKTX2Loader(renderer);
        if (ktx2) loader.setKTX2Loader(ktx2);

        loader.parse(
          buffer,
          "",
          (gltf) => {
            if (cancelled) return;

            const nodes = {};
            const materials = {};
            gltf.scene.traverse((child) => {
              if (child.name) nodes[child.name] = child;
              if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m) => {
                  if (m.name) materials[m.name] = m;
                });
              }
            });

            const result = {
              nodes,
              materials,
              animations: gltf.animations || [],
              scene: gltf.scene,
              ready: true,
              error: null,
            };
            cache[url] = result;
            setState(result);
          },
          (err) => {
            if (cancelled) return;
            // eslint-disable-next-line no-console
            console.error("useGLTFWeb parse error:", err);
            const error = err instanceof Error ? err : new Error(String(err));
            setState((s) => ({ ...s, ready: false, error }));
          }
        );
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("useGLTFWeb load error:", e);
        const error = e instanceof Error ? e : new Error(String(e));
        setState((s) => ({ ...s, ready: false, error }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url, renderer]);

  return state;
}
