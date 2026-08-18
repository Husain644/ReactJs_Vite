import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import JSON5 from "json5";
import {
  getContentById,
  createContent,
  updateContent,
  replaceBlocks,
  updateFields,
} from "../api/contentApi";
import { diffToFieldPatches } from "../utils/diffBlocks";
import FileUploadButton from "../components/FileUploadButton.jsx";

const emptyContent = {
  id: "",
  type: "workshop",
  title: "",
  language: "en",
  accent: "#2563EB",
  accentBg: "#EFF6FF",
  thumbnail: "",
  blocks: [],
};

export default function ContentEditor() {
  const { id } = useParams(); // undefined for "/new"
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = !id;

  const [form, setForm] = useState(() =>
    isNew ? { ...emptyContent, language: searchParams.get("language") || "en" } : emptyContent
  );
  const [blocksText, setBlocksText] = useState("[]");
  const [blocksError, setBlocksError] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // The last blocks tree we know the server has, used to diff against the
  // editor's current text so "Save Changed Fields" only sends what changed.
  const savedBlocksRef = useRef([]);
  const editorRef = useRef(null);

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getContentById(id);
      setForm(data);
      setBlocksText(JSON.stringify(data.blocks, null, 2));
      savedBlocksRef.current = data.blocks;
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Saves top-level fields (title, accent, thumbnail, etc). Never touches blocks.
  const handleSaveFields = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      if (isNew) {
        const created = await createContent({ ...form, blocks: [] });
        navigate(`/three3D/edit/${created._id}`, { replace: true });
        setSaveMessage("Created — now add blocks below and save.");
      } else {
        // eslint-disable-next-line no-unused-vars
        const { blocks, ...topLevelFields } = form;
        const updated = await updateContent(id, topLevelFields);
        setForm(updated);
        setSaveMessage("Saved.");
      }
    } catch (err) {
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Saves the blocks tree — validates JSON first so a typo can't corrupt the doc.
  const handleSaveBlocks = async () => {
    let parsed;
    try {
      parsed = JSON.parse(blocksText);
    } catch (err) {
      setBlocksError(`Invalid JSON: ${err.message}`);
      return;
    }
    setBlocksError(null);
    setSaving(true);
    setSaveMessage(null);
    try {
      const updated = await replaceBlocks(id, parsed);
      setForm(updated);
      savedBlocksRef.current = updated.blocks;
      setSaveMessage(`Blocks saved (v${updated.version}).`);
    } catch (err) {
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Diffs the editor's current text against the last-saved snapshot and
  // sends ONLY the changed leaf fields via PATCH /:id/field — for a one-line
  // text edit deep in a huge tree, this is a tiny request instead of
  // rewriting the whole document.
  const handleSaveFieldChanges = async () => {
    let parsed;
    try {
      parsed = JSON.parse(blocksText);
    } catch (err) {
      setBlocksError(`Invalid JSON: ${err.message}`);
      return;
    }
    setBlocksError(null);

    const patches = diffToFieldPatches(savedBlocksRef.current, parsed);
    // eslint-disable-next-line no-console
    console.log("field patches to save:", patches);
    if (patches.length === 0) {
      setSaveMessage("No field-level changes detected.");
      return;
    }

    setSaving(true);
    setSaveMessage(null);
    try {
      const updated = await updateFields(id, patches);
      setForm(updated);
      setBlocksText(JSON.stringify(updated.blocks, null, 2));
      savedBlocksRef.current = updated.blocks;
      const fieldWord = patches.length === 1 ? "field" : "fields";
      setSaveMessage(`Saved ${patches.length} changed ${fieldWord} (v${updated.version}).`);
    } catch (err) {
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Inserts an uploaded URL at the cursor position in the Monaco editor —
  // a bare quoted string (`"https://..."`), so place your cursor between
  // the quotes of an existing `"url": ""` field before uploading and it
  // drops straight in. Falls back to appending a copy-pasteable line only
  // if the editor instance isn't mounted yet (should never happen in
  // practice, but keeps this from silently doing nothing).
  const insertUrlIntoBlocks = (url) => {
    const editor = editorRef.current;
    if (!editor) {
      setBlocksText((prev) => `${prev}\n${JSON.stringify(url)}`);
      return;
    }
    const selection = editor.getSelection();
    editor.executeEdits("insert-uploaded-url", [
      { range: selection, text: `"${url}"`, forceMoveMarkers: true },
    ]);
    editor.focus();
    // Keep React state in sync with what Monaco now contains.
    setBlocksText(editor.getValue());
  };

  // Lets you paste JS-style block data (comments, trailing commas, unquoted
  // keys) and converts it to strict JSON in place. Does NOT eval — JSON5 is
  // a safe parser, not arbitrary code execution.
  //
  // Also tolerates common copy-paste leftovers from a source .js file:
  //   - a leading "export const content = " / "export default " statement
  //   - a trailing ";" after the closing bracket
  // since JSON5 parses a single value, not a JS statement.
  const handleConvertJs = () => {
    let text = blocksText.trim();
    // Strip a leading "export const NAME =" or "export default"
    text = text.replace(/^export\s+(default|const\s+\w+\s*=)\s*/, "");
    // Strip a trailing statement-terminator semicolon
    text = text.replace(/;\s*$/, "");

    try {
      const parsed = JSON5.parse(text);
      setBlocksText(JSON.stringify(parsed, null, 2));
      setBlocksError(null);
    } catch (err) {
      setBlocksError(`Could not parse as JS/JSON5: ${err.message}`);
    }
  };

  if (loading) return <div className="editor__state">Loading…</div>;
  if (loadError) return <div className="editor__state editor__state--error">Error: {loadError}</div>;

  return (
    <div className="editor">
      <header className="editor__header">
        <h1>{isNew ? "New Workshop" : form.title || "Edit Workshop"}</h1>
        {!isNew && <span className={`badge badge--${form.status}`}>{form.status}</span>}
      </header>

      {saveMessage && <div className="editor__save-message">{saveMessage}</div>}

      <section className="editor__section">
        <h2>Details</h2>

        <label className="field">
          <span>Slug (id)</span>
          <input
            value={form.id}
            disabled={!isNew}
            onChange={(e) => handleFieldChange("id", e.target.value)}
            placeholder="engineering_drawing_gdt"
          />
        </label>

        <label className="field">
          <span>Title</span>
          <input
            value={form.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            placeholder="Engineering Drawing, 3D & GD&T"
          />
        </label>

        <label className="field">
          <span>Language</span>
          <select
            value={form.language}
            disabled={!isNew}
            onChange={(e) => handleFieldChange("language", e.target.value)}
          >
            <option value="en">English (en)</option>
            <option value="hi">Hindi (hi)</option>
          </select>
          {!isNew && (
            <span className="field__hint">
              Locked after creation — same slug can exist once per language, so create a new
              workshop with this slug to add another language instead of changing this.
            </span>
          )}
        </label>

        <div className="field-row">
          <label className="field">
            <span>Accent</span>
            <input
              type="color"
              value={form.accent}
              onChange={(e) => handleFieldChange("accent", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Accent BG</span>
            <input
              type="color"
              value={form.accentBg}
              onChange={(e) => handleFieldChange("accentBg", e.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span>Thumbnail URL</span>
          <input
            value={form.thumbnail}
            onChange={(e) => handleFieldChange("thumbnail", e.target.value)}
            placeholder="https://..."
          />
        </label>

        <div className="field">
          <span>Upload thumbnail</span>
          <FileUploadButton
            folder="thumbnails"
            accept="image/*"
            icon="🖼️"
            label="Upload Thumbnail Image"
            onUploaded={(url) => handleFieldChange("thumbnail", url)}
          />
        </div>

        <button className="btn btn--primary" disabled={saving} onClick={handleSaveFields}>
          {saving ? "Saving…" : isNew ? "Create Workshop" : "Save Details"}
        </button>
      </section>

      {!isNew && (
        <section className="editor__section">
          <h2>Blocks (raw JSON)</h2>
          <p className="editor__hint">
            Click inside the JSON below where a URL should go (e.g. between the quotes of an{" "}
            <code>"url": ""</code> field), then click the matching upload button — the URL drops
            in at your cursor. Use <strong>Upload Image</strong> for an <code>image</code> block's{" "}
            <code>image</code> field or a thumbnail, <strong>Upload PDF</strong> for a{" "}
            <code>pdf</code> block's <code>url</code> field, and{" "}
            <strong>Upload 3D Model (.glb)</strong> for a <code>modal3D</code> block's{" "}
            <code>url</code> field.
          </p>

          <div className="editor__upload-row">
            <FileUploadButton
              folder="images"
              accept="image/*"
              icon="🖼️"
              label="Upload Image"
              onUploaded={insertUrlIntoBlocks}
            />
            <FileUploadButton
              folder="pdfs"
              accept="application/pdf"
              icon="📄"
              label="Upload PDF"
              onUploaded={insertUrlIntoBlocks}
            />
            <FileUploadButton
              folder="models"
              accept=".glb"
              icon="🧊"
              label="Upload 3D Model (.glb)"
              onUploaded={insertUrlIntoBlocks}
            />
            <button className="btn btn--small" onClick={handleConvertJs} type="button">
              Convert JS/JSON5 → JSON
            </button>
          </div>

          <div className="editor__blocks-code">
            <Editor
              height="480px"
              defaultLanguage="json"
              value={blocksText}
              onChange={(value) => setBlocksText(value ?? "")}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              theme="vs"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                wordWrap: "on",
              }}
            />
          </div>

          {blocksError && <div className="editor__blocks-error">{blocksError}</div>}

          <div className="editor__upload-row">
            <button className="btn btn--primary" disabled={saving} onClick={handleSaveFieldChanges}>
              {saving ? "Saving…" : "Save Changed Fields Only"}
            </button>
            <button className="btn" disabled={saving} onClick={handleSaveBlocks}>
              {saving ? "Saving…" : "Save Blocks (Full)"}
            </button>
          </div>
          <p className="editor__hint">
            "Save Changed Fields Only" diffs against what's on the server and sends just the
            edited paragraphs/values — use this for small text tweaks. "Save Blocks (Full)"
            overwrites the entire tree — use it after reordering, adding, or deleting blocks.
          </p>
        </section>
      )}
    </div>
  );
}