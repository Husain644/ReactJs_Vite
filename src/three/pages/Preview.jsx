import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getContentById, updateFields } from "../api/contentApi";
import BlockRenderer from "../preview/BlockRendererWeb";
import { getByPath } from "../preview/findItemById";
import "../preview/preview.css";

export default function Preview() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Navigation stack mirrors the RN app's screen stack (WorkshopHome ->
  // push ItemScreen -> push ItemScreen -> ...). Each entry is
  // { title, blocks, accent, blocksPath } — blocksPath is the exact
  // dot-path to this screen's `blocks` array within the content document,
  // needed so edit-mode field saves can compute correct child paths and
  // so a successful save can re-pull fresh data for every open screen.
  const [stack, setStack] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getContentById(id);
      setContent(data);

      const { blocks: rootBlocks, basePath: rootBasePath } = unwrapRoot(data);
      setStack([{ title: data.title, blocks: rootBlocks, accent: data.accent || "#2563eb", blocksPath: rootBasePath }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // The whole document's root — stays fixed regardless of how deep the
  // current screen is, since carousel targets / readMoreItem / viewAllItem
  // reference sections defined at the document root. Recomputed whenever
  // `content` changes (i.e. after a successful field save) so lookups
  // never operate on stale structure.
  const absoluteRoot = useMemo(() => {
    if (!content) return { blocks: [], basePath: "blocks" };
    const { blocks, basePath } = unwrapRoot(content);
    return { blocks, basePath };
  }, [content]);

  const pushScreen = (item, blocksPath, accent) => {
    setStack((prev) => [
      ...prev,
      { title: item.title, blocks: item.blocks || [], accent: item.accent || accent, blocksPath },
    ]);
  };

  const popScreen = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  // Saves exactly one field via PATCH /:id/field (never the full document),
  // then refreshes every open screen's blocks from the response so the
  // edit shows up immediately without a reload — including screens deeper
  // or shallower in the stack than the one that was actually edited.
  const handleSaveField = async (path, value) => {
    const updated = await updateFields(id, [{ path, value }]);
    setContent(updated);
    setStack((prev) =>
      prev.map((screen) => ({
        ...screen,
        blocks: getByPath(updated, screen.blocksPath) || [],
      }))
    );
  };

  if (loading) return <div className="pv-page__state">Loading preview…</div>;
  if (error) return <div className="pv-page__state pv-page__state--error">Error: {error}</div>;
  if (!content) return null;

  const current = stack[stack.length - 1];

  return (
    <div className="pv-page">
      <header className="pv-page__header">
        <Link to="/three3D" className="pv-btn pv-btn--ghost pv-btn--small">
          ← Dashboard
        </Link>
        {stack.length > 1 && (
          <button className="pv-btn pv-btn--ghost pv-btn--small" onClick={popScreen}>
            ← Back
          </button>
        )}
        <div className="pv-page__breadcrumb">
          {stack.map((s, i) => (
            <span key={i}>
              {i > 0 && " › "}
              {s.title}
            </span>
          ))}
        </div>
        <span className={`badge badge--lang-${content.language || "en"}`}>
          {(content.language || "en").toUpperCase()}
        </span>
        <Link to={`/three3D/edit/${id}`} className="pv-btn pv-btn--small">
          Edit JSON
        </Link>
      </header>

      <label className={`pv-editmode-toggle ${editMode ? "pv-editmode-toggle--on" : ""}`}>
        <input type="checkbox" checked={editMode} onChange={(e) => setEditMode(e.target.checked)} />
        Edit mode
      </label>

      <div className="pv-page__body">
        {editMode && (
          <div className="pv-editmode-banner">
            ✎ Edit mode is on — hover any text field for a pencil to edit it in place. Saves go
            straight to that one field, not the whole document.
          </div>
        )}
        {current ? (
          <BlockRenderer
            blocks={current.blocks}
            basePath={current.blocksPath}
            absoluteRoot={absoluteRoot}
            accent={current.accent}
            onNavigate={pushScreen}
            editMode={editMode}
            onSaveField={handleSaveField}
          />
        ) : (
          <div className="pv-page__state">No blocks to preview.</div>
        )}
      </div>
    </div>
  );
}

// Some content docs (e.g. an aggregate "workshop" record) wrap a single
// workshop object inside blocks[0] instead of holding the block tree
// directly — same convention the RN app's WorkshopHome.js uses
// ("workshop.length === 1 -> render workshop[0] directly").
function unwrapRoot(data) {
  const rawBlocks = data.blocks || [];
  const isWrapped =
    rawBlocks.length === 1 && rawBlocks[0]?.type === "workshop" && Array.isArray(rawBlocks[0]?.blocks);
  return isWrapped ? { blocks: rawBlocks[0].blocks, basePath: "blocks.0.blocks" } : { blocks: rawBlocks, basePath: "blocks" };
}
