import { useState, Component } from "react";
import { resolveNavRefWithLocation } from "./findItemById";
import EditableField from "./EditableField";
import Model3DModal from "./Model3DModal";

// If Model3DModal (or anything it imports/renders — the KTX2 loader, the
// GLTF parser, drei's OrbitControls, etc.) throws synchronously, React
// unmounts the whole subtree with ZERO visible feedback unless something
// outside it catches the error. This is that catch — without it "the
// modal doesn't open" has no way to ever show WHY.
class Model3DBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("3D modal crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="pv-3d-modal-overlay" onClick={this.props.onClose}>
          <div className="pv-3d-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pv-3d-modal__header">
              <div className="pv-3d-modal__title">3D viewer crashed</div>
              <button className="pv-3d-modal__close" onClick={this.props.onClose} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="pv-3d-modal__canvas">
              <div className="pv-3d-modal__error">
                <div className="pv-3d-modal__error-icon">⚠</div>
                <div>The 3D viewer itself crashed before it could load anything.</div>
                <div className="pv-3d-modal__error-detail">
                  {this.state.error?.message || String(this.state.error)}
                </div>
                <div className="pv-3d-modal__error-detail">
                  Likely a missing/mismatched package — check that <code>three</code>,{" "}
                  <code>@react-three/fiber</code>, and <code>@react-three/drei</code> are all
                  installed and their versions are compatible with each other.
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------- small helpers ----------

// Shared trigger used by the modal3D block, hero blocks with a modelUrl,
// and resource_list rows of type "modal3D" — renders whatever `children`
// is as a clickable trigger and owns the open/close state for the popup
// GLB viewer, so nothing GLB-related ever navigates away from the page.
//
// thumbnailPath / onSaveField: a "Capture" inside the modal uploads to R2
// and then PATCHes just `${thumbnailPath}` via the same field-save path
// as every other edit-mode change — never the whole document.
// cameraAngle / cameraAnglePath: current saved [x,y,z] (used to restore
// the view on open) and where "Save Camera" should PATCH it to. Omit any
// of these and the corresponding button still works, it just won't
// auto-save anywhere.
function Model3DTrigger({ url, title, subtitle, thumbnailPath, cameraAngle, cameraAnglePath, onSaveField, children }) {
  const [open, setOpen] = useState(false);
  const handleCaptured =
    thumbnailPath && onSaveField ? (capturedUrl) => onSaveField(thumbnailPath, capturedUrl) : undefined;
  const handleSaveCamera =
    cameraAnglePath && onSaveField ? (position) => onSaveField(cameraAnglePath, position) : undefined;
  return (
    <>
      {children(() => setOpen(true))}
      {open && (
        <Model3DBoundary onClose={() => setOpen(false)}>
          <Model3DModal
            url={url}
            title={title}
            subtitle={subtitle}
            cameraAngle={cameraAngle}
            onClose={() => setOpen(false)}
            onCaptured={handleCaptured}
            onSaveCamera={handleSaveCamera}
          />
        </Model3DBoundary>
      )}
    </>
  );
}

function youtubeEmbedUrl(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function ProgressRing({ progress = 0, accent = "#2563eb", size = 34 }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, progress)) / 100) * c;
  return (
    <svg width={size} height={size} className="pv-ring">
      <circle cx={size / 2} cy={size / 2} r={r} className="pv-ring__track" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={accent}
        strokeWidth="3"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="53%" textAnchor="middle" className="pv-ring__text">
        {progress}%
      </text>
    </svg>
  );
}

// ---------- Main renderer ----------
//
// basePath: dot-path to THIS `blocks` array within the content document
//   (e.g. "blocks.0.blocks" for a wrapped workshop, or "blocks.0.items.2.blocks"
//   for a drilled-into item). Each block at index i lives at `${basePath}.${i}`.
// absoluteRoot: { blocks, basePath } for the WHOLE document's root blocks —
//   stays fixed regardless of how deep the current screen is, since carousel
//   targets / readMoreItem / viewAllItem reference sections defined at the
//   document root, not relative to whatever screen you're currently on.
// editMode / onSaveField: when editMode is true, editable text fields show
//   a pencil toggle; onSaveField(path, value) is called on Save and must
//   hit the field-patch API (never the full-document save).
export default function BlockRenderer({
  blocks = [],
  basePath,
  absoluteRoot,
  onNavigate,
  accent = "#D9534F",
  editMode = false,
  onSaveField,
}) {
  const goTo = (refOrItem, knownBlocksPath) => {
    if (knownBlocksPath) {
      onNavigate?.(refOrItem, knownBlocksPath, accent);
      return;
    }
    const resolved = resolveNavRefWithLocation(absoluteRoot?.blocks, absoluteRoot?.basePath, refOrItem);
    if (resolved) onNavigate?.(resolved.item, resolved.blocksPath, accent);
  };

  return (
    <div className="pv-stack">
      {blocks.map((block, i) => {
        const blockPath = `${basePath}.${i}`;

        switch (block.type) {
          case "carousel":
            return (
              <Carousel key={i} items={block.items} config={block.caroselConfig} onItemPress={goTo} />
            );

          case "alert":
            return (
              <div
                key={i}
                className="pv-alert"
                style={{ background: block.accentBg || "#FFECEF", borderColor: block.accent || accent }}
              >
                <div className="pv-alert__icon">{block.icon}</div>
                <div>
                  <EditableField
                    editMode={editMode}
                    path={`${blockPath}.title`}
                    value={block.title}
                    onSave={onSaveField}
                    as="div"
                    className="pv-alert__title"
                    style={{ color: block.accent || accent }}
                  />
                  <EditableField
                    editMode={editMode}
                    path={`${blockPath}.text`}
                    value={block.text}
                    onSave={onSaveField}
                    multiline
                    as="div"
                    className="pv-alert__text"
                  />
                </div>
              </div>
            );

          case "intro_card":
            return (
              <div key={i} className="pv-intro">
                {block.thumbnail && <img src={block.thumbnail} alt="" className="pv-intro__img" />}
                <div className="pv-intro__body">
                  <EditableField
                    editMode={editMode}
                    path={`${blockPath}.title`}
                    value={block.title}
                    onSave={onSaveField}
                    as="h3"
                    style={{ color: block.accent || accent }}
                  />
                  <EditableField
                    editMode={editMode}
                    path={`${blockPath}.text`}
                    value={block.text}
                    onSave={onSaveField}
                    multiline
                    as="p"
                  />
                  <div className="pv-intro__actions">
                    {block.readMoreItem && (
                      <button className="pv-btn" style={{ background: block.accent || accent }} onClick={() => goTo(block.readMoreItem)}>
                        Read More →
                      </button>
                    )}
                    {block.pdfUrl && (
                      <a className="pv-btn pv-btn--ghost" href={block.pdfUrl} target="_blank" rel="noreferrer">
                        View PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );

          case "resource_list":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                <div className="pv-resource-list">
                  {(block.items || []).map((r, idx) => (
                    <ResourceRow
                      key={idx}
                      r={r}
                      thumbnailPath={`${blockPath}.items.${idx}.thumbnail`}
                      cameraAnglePath={`${blockPath}.items.${idx}.modelConfig.cameraAngle`}
                      onSaveField={onSaveField}
                    />
                  ))}
                </div>
                {block.viewAllItem && (
                  <button className="pv-link" onClick={() => goTo(block.viewAllItem)}>
                    View all →
                  </button>
                )}
              </div>
            );

          case "outcomes":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                <div className="pv-outcomes">
                  {(block.items || []).map((o, idx) => (
                    <div key={idx} className="pv-outcome" style={{ background: o.color || "#F5F5F5" }}>
                      <div className="pv-outcome__icon">{o.icon}</div>
                      <div className="pv-outcome__label">
                        {(o.label || "").split("\n").map((line, li) => (
                          <div key={li}>{line}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );

          case "sections_list":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                {(block.items || []).map((sec, idx) => (
                  <button
                    key={idx}
                    className="pv-row"
                    onClick={() => goTo(sec, `${blockPath}.items.${idx}.blocks`)}
                  >
                    <div className="pv-row__icon" style={{ background: sec.iconBg || "#F5F5F5" }}>
                      {sec.icon}
                    </div>
                    <div className="pv-row__body">
                      <div className="pv-row__title">{sec.title}</div>
                      <div className="pv-row__sub">{sec.subtitle}</div>
                    </div>
                    <ProgressRing progress={sec.progress || 0} accent={accent} />
                    <div className="pv-row__arrow">›</div>
                  </button>
                ))}
              </div>
            );

          case "items":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                {(block.items || []).map((it, idx) => (
                  <button
                    key={idx}
                    className="pv-row pv-row--flat"
                    onClick={() => goTo(it, `${blockPath}.items.${idx}.blocks`)}
                  >
                    <div className="pv-row__title">
                      {it.icon} {it.title}
                    </div>
                    <div className="pv-row__arrow">›</div>
                  </button>
                ))}
              </div>
            );

          case "hero":
            return (
              <div key={i} className="pv-hero" style={block.thumbnail ? { backgroundImage: `url(${block.thumbnail})` } : undefined}>
                <div className="pv-hero__overlay">
                  <div className="pv-hero__subtitle">{block.subtitle}</div>
                  <div className="pv-hero__title">{block.title}</div>
                  {block.modelUrl && (
                    <Model3DTrigger
                      url={block.modelUrl}
                      title={block.title}
                      subtitle={block.subtitle}
                      thumbnailPath={`${blockPath}.thumbnail`}
                      cameraAngle={block.modelConfig?.cameraAngle}
                      cameraAnglePath={`${blockPath}.modelConfig.cameraAngle`}
                      onSaveField={onSaveField}
                    >
                      {(openModal) => (
                        <button className="pv-btn pv-btn--small pv-hero__3d-btn" onClick={openModal}>
                          View in 3D ⛶
                        </button>
                      )}
                    </Model3DTrigger>
                  )}
                </div>
                {block.videoUrl && youtubeEmbedUrl(block.videoUrl) && (
                  <iframe
                    className="pv-hero__video"
                    src={youtubeEmbedUrl(block.videoUrl)}
                    title={block.title}
                    allowFullScreen
                  />
                )}
              </div>
            );

          case "heading":
            return (
              <EditableField
                key={i}
                editMode={editMode}
                path={`${blockPath}.text`}
                value={block.text}
                onSave={onSaveField}
                as="h3"
                className="pv-heading"
              />
            );

          case "paragraph":
            return (
              <EditableField
                key={i}
                editMode={editMode}
                path={`${blockPath}.text`}
                value={block.text}
                onSave={onSaveField}
                multiline
                as="p"
                className="pv-paragraph"
              />
            );

          case "image":
            return (
              <figure key={i} className="pv-figure">
                <img src={block.image} alt={block.caption || ""} />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );

          case "video": {
            const embed = youtubeEmbedUrl(block.url);
            return (
              <div key={i} className="pv-video">
                {block.title && <div className="pv-video__title">{block.title}</div>}
                {embed ? (
                  <iframe className="pv-video__frame" src={embed} title={block.title} allowFullScreen />
                ) : (
                  <a href={block.url} target="_blank" rel="noreferrer" className="pv-btn pv-btn--ghost">
                    Open video ↗
                  </a>
                )}
              </div>
            );
          }

          case "modal3D":
            return (
              <Model3DTrigger
                key={i}
                url={block.url}
                title={block.title}
                subtitle={block.subtitle}
                thumbnailPath={`${blockPath}.thumbnail`}
                cameraAngle={block.modelConfig?.cameraAngle}
                cameraAnglePath={`${blockPath}.modelConfig.cameraAngle`}
                onSaveField={onSaveField}
              >
                {(openModal) => (
                  <button
                    className={`pv-3d${block.thumbnail ? " pv-3d--has-thumb" : ""}`}
                    onClick={openModal}
                  >
                    {block.thumbnail && (
                      <div className="pv-3d__thumb" style={{ backgroundImage: `url(${block.thumbnail})` }} />
                    )}
                    <div className="pv-3d__badge">3D MODEL</div>
                    <div className="pv-3d__title">{block.title}</div>
                    {block.subtitle && <div className="pv-3d__subtitle">{block.subtitle}</div>}
                    <span className="pv-btn pv-btn--ghost">View in 3D ⛶</span>
                  </button>
                )}
              </Model3DTrigger>
            );

          case "list":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                <ul className="pv-list">
                  {(block.items || []).map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            );

          case "note":
            return (
              <EditableField
                key={i}
                editMode={editMode}
                path={`${blockPath}.text`}
                value={block.text}
                onSave={onSaveField}
                multiline
                as="div"
                className={`pv-note pv-note--${block.variant || "info"}`}
              />
            );

          case "banner":
            return (
              <EditableField
                key={i}
                editMode={editMode}
                path={`${blockPath}.text`}
                value={block.text}
                onSave={onSaveField}
                as="div"
                className="pv-banner"
              />
            );

          case "pdf":
            return (
              <a key={i} href={block.url} target="_blank" rel="noreferrer" className="pv-file">
                <span className="pv-file__icon">📄</span>
                <span>{block.title || "PDF document"}</span>
              </a>
            );

          case "table":
            return (
              <div key={i} className="pv-table-wrap">
                <table className="pv-table">
                  {block.headers && (
                    <thead>
                      <tr>
                        {block.headers.map((h, hi) => (
                          <th key={hi}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {(block.rows || []).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "formula":
            return (
              <div key={i} className="pv-card">
                <div className="pv-formula">{block.expression}</div>
                {(block.variables || []).map((v, vi) => (
                  <div key={vi} className="pv-formula__var">
                    <strong>{v.symbol}</strong> — {v.meaning}
                  </div>
                ))}
              </div>
            );

          case "steps":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                <ol className="pv-steps">
                  {(block.steps || []).map((s, si) => (
                    <li key={si}>
                      <span className="pv-steps__num">{s.step ?? si + 1}</span>
                      <span>{s.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );

          case "keyvalue":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                <div className="pv-kv">
                  {(block.items || []).map((kv, ki) => (
                    <div key={ki} className="pv-kv__row">
                      <div className="pv-kv__key">{kv.key}</div>
                      <div className="pv-kv__value">{kv.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            );

          case "comparison":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                <div className="pv-comparison">
                  {[block.left, block.right].map((side, si) => (
                    <div key={si} className="pv-comparison__col">
                      <div className="pv-comparison__label">{side?.label}</div>
                      <ul>
                        {(side?.points || []).map((p, pi) => (
                          <li key={pi}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );

          case "diagram":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                <DiagramSvg shapes={block.shapes} width={block.width} height={block.height} />
              </div>
            );

          case "callout":
            return (
              <div key={i} className={`pv-callout pv-callout--${block.variant || "default"}`}>
                <EditableField
                  editMode={editMode}
                  path={`${blockPath}.term`}
                  value={block.term}
                  onSave={onSaveField}
                  as="div"
                  className="pv-callout__term"
                />
                <EditableField
                  editMode={editMode}
                  path={`${blockPath}.definition`}
                  value={block.definition}
                  onSave={onSaveField}
                  multiline
                  as="div"
                  className="pv-callout__def"
                />
                {(block.example || editMode) && (
                  <EditableField
                    editMode={editMode}
                    path={`${blockPath}.example`}
                    value={block.example}
                    onSave={onSaveField}
                    multiline
                    as="div"
                    className="pv-callout__example"
                  />
                )}
              </div>
            );

          case "badge_row":
            return (
              <div key={i} className="pv-badge-row">
                {block.title && <div className="pv-badge-row__title">{block.title}</div>}
                <div className="pv-badge-row__list">
                  {(block.badges || []).map((b, bi) => (
                    <span key={bi} className={`pv-badge pv-badge--${b.color || "blue"}`}>
                      {b.label}: {b.value}
                    </span>
                  ))}
                </div>
              </div>
            );

          case "progress_bar":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                {(block.items || []).map((p, pi) => (
                  <div key={pi} className="pv-progress-item">
                    <div className="pv-progress-item__label">
                      <span>{p.label}</span>
                      <span>{p.value}%</span>
                    </div>
                    <div className="pv-progress-item__track">
                      <div
                        className="pv-progress-item__fill"
                        style={{ width: `${p.value}%`, background: p.color || accent }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );

          case "timeline":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                <div className="pv-timeline">
                  {(block.items || []).map((t, ti) => (
                    <div key={ti} className={`pv-timeline__item ${t.highlight ? "pv-timeline__item--hl" : ""}`}>
                      <div className="pv-timeline__year">{t.year}</div>
                      <div className="pv-timeline__event">{t.event}</div>
                    </div>
                  ))}
                </div>
              </div>
            );

          case "spec_card":
            return (
              <div key={i} className="pv-card">
                <h4 className="pv-card__title">
                  {block.icon} {block.title}
                </h4>
                {(block.specs || []).map((g, gi) => (
                  <div key={gi} className="pv-spec-group">
                    <div className="pv-spec-group__title">{g.group}</div>
                    {(g.rows || []).map((r, ri) => (
                      <div key={ri} className="pv-kv__row">
                        <div className="pv-kv__key">{r.label}</div>
                        <div className="pv-kv__value">{r.value}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );

          case "tabs":
            return (
              <Tabs
                key={i}
                tabs={block.tabs}
                blockPath={blockPath}
                onNavigate={onNavigate}
                accent={accent}
                absoluteRoot={absoluteRoot}
                editMode={editMode}
                onSaveField={onSaveField}
              />
            );

          case "mcq":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                {(block.questions || []).map((q, qi) => (
                  <McqCard key={qi} q={q} number={qi + 1} />
                ))}
              </div>
            );

          case "qa":
            return (
              <div key={i} className="pv-card">
                {block.title && <h4 className="pv-card__title">{block.title}</h4>}
                {(block.questions || []).map((q, qi) => (
                  <QaCard key={qi} q={q} number={qi + 1} />
                ))}
              </div>
            );

          default:
            return (
              <div key={i} className="pv-unknown">
                Unsupported block type: <code>{block.type}</code>
              </div>
            );
        }
      })}
    </div>
  );
}

// ---------- sub-components ----------

function ResourceRow({ r, thumbnailPath, cameraAnglePath, onSaveField }) {
  const icon = { pdf: "📄", video: "🎬", modal3D: "🧊", audio: "🎧" }[r.type] || "📎";

  if (r.type === "modal3D") {
    return (
      <Model3DTrigger
        url={r.url}
        title={r.title}
        thumbnailPath={thumbnailPath}
        cameraAngle={r.modelConfig?.cameraAngle}
        cameraAnglePath={cameraAnglePath}
        onSaveField={onSaveField}
      >
        {(openModal) => (
          <button className="pv-resource-row pv-resource-row--button" onClick={openModal}>
            {r.thumbnail ? (
              <span className="pv-resource-row__thumb" style={{ backgroundImage: `url(${r.thumbnail})` }} />
            ) : (
              <span className="pv-resource-row__icon">{icon}</span>
            )}
            <span className="pv-resource-row__title">{r.title}</span>
            {r.size && <span className="pv-resource-row__size">{r.size}</span>}
          </button>
        )}
      </Model3DTrigger>
    );
  }

  return (
    <a className="pv-resource-row" href={r.url} target="_blank" rel="noreferrer">
      <span className="pv-resource-row__icon">{icon}</span>
      <span className="pv-resource-row__title">{r.title}</span>
      {r.size && <span className="pv-resource-row__size">{r.size}</span>}
    </a>
  );
}

function Carousel({ items = [], onItemPress }) {
  return (
    <div className="pv-carousel">
      {items.map((item, i) => (
        <button key={item.id ?? i} className="pv-carousel__item" onClick={() => onItemPress(item)}>
          {item.thumbnail && <img src={item.thumbnail} alt="" />}
          <div className="pv-carousel__overlay">
            <div className="pv-carousel__title">{item.title}</div>
            <div className="pv-carousel__subtitle">{item.subtitle}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function Tabs({ tabs = [], blockPath, onNavigate, accent, absoluteRoot, editMode, onSaveField }) {
  const [active, setActive] = useState(0);
  if (!tabs.length) return null;
  return (
    <div className="pv-tabs">
      <div className="pv-tabs__strip">
        {tabs.map((t, i) => (
          <button
            key={i}
            className={`pv-tabs__tab ${i === active ? "pv-tabs__tab--active" : ""}`}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pv-tabs__panel">
        <BlockRenderer
          blocks={tabs[active]?.blocks || []}
          basePath={`${blockPath}.tabs.${active}.blocks`}
          onNavigate={onNavigate}
          accent={accent}
          absoluteRoot={absoluteRoot}
          editMode={editMode}
          onSaveField={onSaveField}
        />
      </div>
    </div>
  );
}

function McqCard({ q, number }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="pv-mcq">
      <div className="pv-mcq__q">
        <span className="pv-mcq__num">Q{number}</span> {q.q}
      </div>
      <div className="pv-mcq__options">
        {(q.options || []).map((opt, i) => {
          let cls = "pv-mcq__option";
          if (revealed) {
            if (i === q.answer) cls += " pv-mcq__option--correct";
            else if (i === selected) cls += " pv-mcq__option--wrong";
          } else if (i === selected) {
            cls += " pv-mcq__option--selected";
          }
          return (
            <button key={i} className={cls} disabled={revealed} onClick={() => setSelected(i)}>
              {opt}
            </button>
          );
        })}
      </div>
      <div className="pv-mcq__actions">
        {!revealed ? (
          <button className="pv-btn pv-btn--small" disabled={selected === null} onClick={() => setRevealed(true)}>
            Check Answer
          </button>
        ) : (
          <button
            className="pv-btn pv-btn--small pv-btn--ghost"
            onClick={() => {
              setRevealed(false);
              setSelected(null);
            }}
          >
            Reset
          </button>
        )}
      </div>
      {revealed && q.explanation && <div className="pv-mcq__explanation">{q.explanation}</div>}
    </div>
  );
}

function QaCard({ q, number }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="pv-qa">
      <div className="pv-qa__q">
        <span className="pv-qa__num">Q{number}</span> {q.q}
      </div>
      {revealed ? (
        <div className="pv-qa__answer">
          <div className="pv-qa__answer-label">Answer</div>
          <div className="pv-qa__answer-text">{q.a}</div>
          <button className="pv-link" onClick={() => setRevealed(false)}>
            Hide answer ↑
          </button>
        </div>
      ) : (
        <button className="pv-link" onClick={() => setRevealed(true)}>
          Show answer ›
        </button>
      )}
    </div>
  );
}

function DiagramSvg({ shapes = [], width = 320, height = 200 }) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="pv-diagram">
      {shapes.map((s, i) => {
        switch (s.kind) {
          case "rect":
            return (
              <rect
                key={i}
                x={s.x}
                y={s.y}
                width={s.w}
                height={s.h}
                fill={s.filled ? s.color : "none"}
                stroke={s.filled ? "none" : s.color}
                strokeWidth={s.strokeWidth || 1}
              />
            );
          case "circle":
            return (
              <circle
                key={i}
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                fill={s.filled ? s.color : "none"}
                stroke={s.filled ? "none" : s.color}
                strokeWidth={s.strokeWidth || 1}
              />
            );
          case "line":
          case "arrow":
            return (
              <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={s.strokeWidth || 1.5} />
            );
          case "path":
            return (
              <path key={i} d={s.d} fill={s.filled ? s.color : "none"} stroke={s.filled ? "none" : s.color} strokeWidth={s.strokeWidth || 1} />
            );
          case "text":
            return (
              <text key={i} x={s.x} y={s.y} fontSize={s.fontSize || 10} fill={s.color}>
                {s.text}
              </text>
            );
          default:
            return null;
        }
      })}
    </svg>
  );
}
