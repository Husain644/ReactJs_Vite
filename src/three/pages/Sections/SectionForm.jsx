import { useState } from 'react';
import { sectionApi } from '../../api/services.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Btn, FormInput, SelectInput } from '../../components/common/Common.jsx';

const TYPES = [
  'header','footer','heading','subheading','text','image','gallery','banner',
  'cards','accordion','timeline','stepper','table','formula','equation',
  'comparison','diagram','3dModel','video','audio','pdf','quiz',
  'tip','warning','button','links','divider','spacer','relatedTopics',
].map(v => ({ value: v, label: v }));

const LAZY_TYPES = new Set(['3dModel','video','quiz','pdf']);

export default function SectionForm({ screenId, section, onSaved }) {
  const isEdit = !!section;
  const [type,       setType]       = useState(section?.type       || 'heading');
  const [variant,    setVariant]    = useState(section?.variant    || 'default');
  const [sectionKey, setSectionKey] = useState(section?.sectionKey || '');
  const [order,      setOrder]      = useState(section?.order ?? '');
  const [isLazy,     setIsLazy]     = useState(section?.isLazy     ?? LAZY_TYPES.has(type));
  const [isVisible,  setIsVisible]  = useState(section?.isVisible  ?? true);
  const [dataStr,    setDataStr]    = useState(
    section?.data ? JSON.stringify(section.data, null, 2) : getDefaultData(section?.type || 'heading')
  );
  const [dataErr,    setDataErr]    = useState('');
  const { run, loading } = useApi();
  const toast = useToast();

  const handleTypeChange = (t) => {
    setType(t);
    setIsLazy(LAZY_TYPES.has(t));
    if (!section) setDataStr(getDefaultData(t));
  };

  const handleSave = async () => {
    let parsed;
    try {
      parsed = JSON.parse(dataStr);
      setDataErr('');
    } catch {
      setDataErr('Invalid JSON in data field');
      return;
    }
    const payload = {
      screenId,
      type,
      variant,
      sectionKey,
      isLazy,
      isVisible,
      data: parsed,
      ...(order !== '' ? { order: Number(order) } : {}),
    };
    try {
      if (isEdit) {
        await run(sectionApi.update, section._id, payload);
        toast.success('Section updated');
      } else {
        await run(sectionApi.create, payload);
        toast.success('Section created');
      }
      onSaved();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="form-stack">
      <div className="form-row">
        <SelectInput label="Type" value={type} onChange={e => handleTypeChange(e.target.value)} options={TYPES} />
        <FormInput label="Variant" value={variant} onChange={e => setVariant(e.target.value)} placeholder="default" />
      </div>

      <div className="form-row">
        <FormInput label="Order" type="number" value={order} onChange={e => setOrder(e.target.value)} placeholder="auto" />
        <FormInput label="Section Key (optional)" value={sectionKey} onChange={e => setSectionKey(e.target.value)} placeholder="intro-heading" />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={isLazy} onChange={e => setIsLazy(e.target.checked)} />
          Lazy load
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={isVisible} onChange={e => setIsVisible(e.target.checked)} />
          Visible
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">
          Data (JSON)
          <span style={{ color: 'var(--gray-400)', fontWeight: 400, marginLeft: 6 }}>— shape depends on type</span>
        </label>
        <textarea
          className={`form-input ${dataErr ? 'error' : ''}`}
          value={dataStr}
          onChange={e => { setDataStr(e.target.value); setDataErr(''); }}
          rows={12}
          style={{ fontFamily: 'var(--mono)', fontSize: 12 }}
        />
        {dataErr && <span className="form-error">{dataErr}</span>}
      </div>

      <div className="form-actions">
        <Btn onClick={handleSave} loading={loading}>{isEdit ? 'Update' : 'Create'}</Btn>
      </div>
    </div>
  );
}

function getDefaultData(type) {
  const defaults = {
    heading:     { text: 'Section Heading' },
    subheading:  { text: 'Subheading text' },
    text:        { text: 'Paragraph content here...' },
    image:       { url: '', caption: '' },
    gallery:     { images: [{ url: '', caption: '' }] },
    banner:      { title: '', subtitle: '', image: '', variant: 'hero' },
    cards:       { title: '', items: [{ title: '', image: '', navigateTo: '' }] },
    accordion:   { items: [{ question: '', answer: '' }] },
    timeline:    { items: [{ year: '', title: '', description: '' }] },
    stepper:     { steps: [{ title: 'Step 1', description: '', image: '' }] },
    table:       { headers: ['Column 1', 'Column 2'], rows: [['Value', 'Value']] },
    formula:     { latex: 'F = ma', label: 'Formula label' },
    equation:    { latex: 'E = mc^2', label: '' },
    comparison:  { items: [{ label: 'Option A', values: [] }, { label: 'Option B', values: [] }] },
    diagram:     { url: '', caption: '' },
    '3dModel':   { modelId: '' },
    video:       { url: '', thumbnail: '', duration: 0 },
    audio:       { url: '', title: '' },
    pdf:         { url: '', title: '', pageCount: 0 },
    quiz:        { quizId: '' },
    tip:         { text: '', icon: '💡' },
    warning:     { text: '', severity: 'medium' },
    button:      { label: '', action: '', variant: 'primary' },
    links:       { items: [{ label: '', url: '' }] },
    divider:     {},
    spacer:      { height: 24 },
    relatedTopics: { items: [{ title: '', slug: '', image: '' }] },
  };
  return JSON.stringify(defaults[type] || {}, null, 2);
}
