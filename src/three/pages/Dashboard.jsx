import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getAllContents,
  deleteContent,
  publishContent,
  duplicateContent,
} from "../api/contentApi";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null); // disables buttons on the row mid-action
  const [language, setLanguage] = useState("en");

  // Workshop pending deletion — { id, title } | null. Delete only actually
  // fires once the user types the title back exactly, so a stray click
  // or a muscle-memory Enter on a native confirm() can't destroy content.
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllContents(language);
      setItems(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    load();
  }, [load]);

  const openDeleteModal = (id, title) => {
    setPendingDelete({ id, title });
    setDeleteConfirmText("");
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    setPendingDelete(null);
    setDeleteConfirmText("");
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setActioningId(id);
    setDeleteError(null);
    try {
      await deleteContent(id);
      setItems((prev) => prev.filter((item) => item._id !== id));
      closeDeleteModal();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setActioningId(null);
    }
  };

  const handlePublish = async (id) => {
    setActioningId(id);
    try {
      const updated = await publishContent(id);
      setItems((prev) => prev.map((item) => (item._id === id ? updated : item)));
    } catch (err) {
      alert(`Publish failed: ${err.message}`);
    } finally {
      setActioningId(null);
    }
  };

  const handleDuplicate = async (id) => {
    setActioningId(id);
    try {
      const copy = await duplicateContent(id);
      setItems((prev) => [copy, ...prev]);
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>Content</h1>
        <div className="dashboard__header-actions">
          <select
            className="dashboard__lang-select"
            aria-label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English (EN)</option>
            <option value="hi">Hindi (HI)</option>
          </select>
          <Link to={`/three3D/new?language=${language}`} className="btn btn--primary">
            + New Workshop
          </Link>
        </div>
      </header>

      {loading && <div className="dashboard__state">Loading…</div>}
      {error && <div className="dashboard__state dashboard__state--error">Error: {error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="dashboard__state">No content yet. Create your first workshop.</div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Language</th>
              <th>Status</th>
              <th>Version</th>
              <th>Updated</th>
              <th className="table__actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const busy = actioningId === item._id;
              return (
                <tr key={item._id} className={busy ? "row--busy" : ""}>
                  <td>
                    <Link to={`/three3D/edit/${item._id}`} className="table__title-link">
                      {item.title}
                    </Link>
                  </td>
                  <td>
                    <code>{item.id}</code>
                  </td>
                  <td>
                    <span className={`badge badge--lang-${item.language || "en"}`}>
                      {(item.language || "en").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge--${item.status}`}>{item.status}</span>
                  </td>
                  <td>v{item.version}</td>
                  <td>{new Date(item.updatedAt).toLocaleString()}</td>
                  <td className="table__actions">
                    <Link to={`/three3D/preview/${item._id}`} className="btn btn--small">
                      Preview
                    </Link>
                    <Link to={`/three3D/edit/${item._id}`} className="btn btn--small">
                      Edit
                    </Link>
                    {item.status !== "published" && (
                      <button
                        className="btn btn--small btn--success"
                        disabled={busy}
                        onClick={() => handlePublish(item._id)}
                      >
                        Publish
                      </button>
                    )}
                    <button
                      className="btn btn--small"
                      disabled={busy}
                      onClick={() => handleDuplicate(item._id)}
                    >
                      Duplicate
                    </button>
                    <button
                      className="btn btn--small btn--danger"
                      disabled={busy}
                      onClick={() => openDeleteModal(item._id, item.title)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      {pendingDelete && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Delete "{pendingDelete.title}"?</h2>
            <p className="modal__body">
              This permanently deletes the workshop and all of its content. This cannot be undone.
              Type the workshop title below to confirm.
            </p>
            <p className="modal__confirm-target">{pendingDelete.title}</p>
            <input
              type="text"
              className="modal__input"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type the workshop title"
              autoFocus
              disabled={actioningId === pendingDelete.id}
            />
            {deleteError && <div className="modal__error">Delete failed: {deleteError}</div>}
            <div className="modal__actions">
              <button
                className="btn"
                onClick={closeDeleteModal}
                disabled={actioningId === pendingDelete.id}
              >
                Cancel
              </button>
              <button
                className="btn btn--danger"
                onClick={confirmDelete}
                disabled={
                  deleteConfirmText !== pendingDelete.title || actioningId === pendingDelete.id
                }
              >
                {actioningId === pendingDelete.id ? "Deleting…" : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}