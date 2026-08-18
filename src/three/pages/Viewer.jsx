import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getContentById } from "../api/contentApi";

export default function Viewer() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getContentById(id);
      setContent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="dashboard__state">Loading…</div>;
  if (error) return <div className="dashboard__state dashboard__state--error">Error: {error}</div>;
  if (!content) return <div className="dashboard__state">Not found.</div>;

  return (
    <div className="viewer">
      <header className="dashboard__header">
        <h1>{content.title}</h1>
        <Link to={`/three3D/edit/${content._id}`} className="btn btn--primary">
          Edit
        </Link>
      </header>

      <p>
        <span className={`badge badge--${content.status}`}>{content.status}</span>{" "}
        v{content.version}
      </p>

      {content.thumbnail && (
        <img
          src={content.thumbnail}
          alt={content.title}
          style={{ maxWidth: "100%", borderRadius: 12, margin: "16px 0" }}
        />
      )}

      <pre style={{ background: "#f1f5f9", padding: 16, borderRadius: 12, overflowX: "auto" }}>
        {JSON.stringify(content.blocks, null, 2)}
      </pre>

      <Link to="/three3D">← Back to dashboard</Link>
    </div>
  );
}
