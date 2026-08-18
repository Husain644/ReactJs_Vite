import { useState } from "react";

/**
 * Wraps a single text field. In normal (non-edit) mode, renders exactly
 * what was rendered before — same tag, same className, same value, zero
 * visual difference. In edit mode, adds a small pencil toggle next to it;
 * clicking swaps to an inline input/textarea with Save/Cancel, and Save
 * calls onSave(path, newValue) — the field-patch API — never a full
 * document rewrite.
 */
export default function EditableField({
  editMode,
  path,
  value,
  onSave,
  multiline = false,
  as: Tag = "span",
  className,
  style,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!editMode) {
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }

  if (!editing) {
    return (
      <div className="pv-editable">
        <Tag className={className} style={style}>
          {value}
        </Tag>
        <button
          type="button"
          className="pv-editable__pencil"
          title="Edit this field"
          onClick={() => {
            setDraft(value ?? "");
            setError(null);
            setEditing(true);
          }}
        >
          ✎
        </button>
      </div>
    );
  }

  const commit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(path, draft);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pv-editable pv-editable--active">
      {multiline ? (
        <textarea
          className="pv-editable__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          autoFocus
        />
      ) : (
        <input
          className="pv-editable__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
      )}
      {error && <div className="pv-editable__error">Save failed: {error}</div>}
      <div className="pv-editable__actions">
        <button type="button" className="pv-btn pv-btn--small" disabled={saving} onClick={commit}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className="pv-btn pv-btn--small pv-btn--ghost"
          disabled={saving}
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
