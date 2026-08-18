import { useState, useRef } from "react";
import { uploadFileToR2 } from "../api/contentApi";

/**
 * Upload button: picks a file, uploads to R2, calls onUploaded(url) when done.
 * Drop this next to any field that needs a URL (thumbnail, pdf, image, glb).
 *
 * Usage:
 *   <FileUploadButton label="Upload PDF" icon="📄" folder="pdfs" accept="application/pdf" onUploaded={(url) => setFieldValue(url)} />
 */
export default function FileUploadButton({ folder = "uploads", onUploaded, accept, label, icon }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [lastUrl, setLastUrl] = useState(null);
  const inputRef = useRef(null);
  const inputId = useRef(`upload-${folder}-${Math.random().toString(36).slice(2)}`);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setProgress(0);
    setError(null);

    try {
      const result = await uploadFileToR2(file, folder, setProgress);
      setLastUrl(result.url);
      setStatus("done");
      onUploaded?.(result.url);
    } catch (err) {
      setError(err.message);
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="upload-btn">
      <label
        htmlFor={inputId.current}
        className={`upload-btn__label ${status === "uploading" ? "upload-btn__label--disabled" : ""}`}
      >
        {icon && <span className="upload-btn__icon">{icon}</span>}
        {status === "uploading" ? "Uploading…" : label || `Upload to ${folder}`}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={status === "uploading"}
        className="upload-btn__input"
        id={inputId.current}
      />

      {status === "uploading" && (
        <div className="upload-btn__progress">{progress}%</div>
      )}

      {status === "error" && (
        <div className="upload-btn__error">Upload failed: {error}</div>
      )}

      {status === "done" && lastUrl && (
        <div className="upload-btn__result">
          <span className="upload-btn__result-label">Uploaded</span>
          <code className="upload-btn__result-url" title={lastUrl}>
            {lastUrl}
          </code>
          <button
            type="button"
            className="upload-btn__copy"
            onClick={() => navigator.clipboard.writeText(lastUrl)}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}