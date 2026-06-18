import { useState } from 'react';
import { quizApi } from '../../api/services.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.jsx';
import {
  PageHeader, Btn, Card, Badge, FormInput, SelectInput, Modal
} from '../../components/common/Common.jsx';
import './QuizzesPage.css';

const EMPTY_Q = {
  question: '', explanation: '', difficulty: 'medium', points: 1,
  options: [{ text: '' }, { text: '' }],
  correctOptionIndexes: [0],
};
const EMPTY_QUIZ = {
  title: '', description: '', quizType: 'mcq',
  passingScore: 60, timeLimitSeconds: 0,
  shuffleQuestions: false, showExplanation: true,
  difficulty: 'medium', tags: '',
  questions: [{ ...EMPTY_Q }],
};

export default function QuizzesPage() {
  const [quiz,       setQuiz]       = useState({ ...EMPTY_QUIZ });
  const [fetchId,    setFetchId]    = useState('');
  const [savedQuiz,  setSavedQuiz]  = useState(null);
  const [publishId,  setPublishId]  = useState('');
  const { run, loading } = useApi();
  const toast = useToast();

  const setField = (key, val) => setQuiz(q => ({ ...q, [key]: val }));

  const addQuestion = () => setQuiz(q => ({ ...q, questions: [...q.questions, { ...EMPTY_Q, options: [{text:''},{text:''}], correctOptionIndexes:[0] }] }));

  const removeQ = (qi) => setQuiz(q => ({ ...q, questions: q.questions.filter((_, i) => i !== qi) }));

  const setQField = (qi, key, val) => setQuiz(q => {
    const qs = [...q.questions];
    qs[qi] = { ...qs[qi], [key]: val };
    return { ...q, questions: qs };
  });

  const addOption = (qi) => setQuiz(q => {
    const qs = [...q.questions];
    if (qs[qi].options.length >= 6) return q;
    qs[qi] = { ...qs[qi], options: [...qs[qi].options, { text: '' }] };
    return { ...q, questions: qs };
  });

  const removeOption = (qi, oi) => setQuiz(q => {
    const qs = [...q.questions];
    const opts = qs[qi].options.filter((_, i) => i !== oi);
    const correct = qs[qi].correctOptionIndexes.filter(c => c !== oi).map(c => c > oi ? c - 1 : c);
    qs[qi] = { ...qs[qi], options: opts, correctOptionIndexes: correct };
    return { ...q, questions: qs };
  });

  const setOptionText = (qi, oi, text) => setQuiz(q => {
    const qs = [...q.questions];
    const opts = [...qs[qi].options];
    opts[oi] = { ...opts[oi], text };
    qs[qi] = { ...qs[qi], options: opts };
    return { ...q, questions: qs };
  });

  const toggleCorrect = (qi, oi) => setQuiz(q => {
    const qs = [...q.questions];
    const curr = qs[qi].correctOptionIndexes;
    const next = curr.includes(oi) ? curr.filter(c => c !== oi) : [...curr, oi];
    if (!next.length) return q;
    qs[qi] = { ...qs[qi], correctOptionIndexes: next };
    return { ...q, questions: qs };
  });

  const handleSave = async () => {
    if (!quiz.title.trim()) { toast.error('Title is required'); return; }
    for (const [i, q] of quiz.questions.entries()) {
      if (!q.question.trim()) { toast.error(`Question ${i+1} is empty`); return; }
      if (q.options.some(o => !o.text.trim())) { toast.error(`All options in Q${i+1} must have text`); return; }
      if (!q.correctOptionIndexes.length) { toast.error(`Q${i+1} needs at least one correct answer`); return; }
    }
    const payload = {
      ...quiz,
      tags: quiz.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      const res = await run(quizApi.create, payload);
      setSavedQuiz(res?.data?.quiz);
      toast.success('Quiz created! Copy the ID to link it to a section.');
    } catch (e) { toast.error(e.message); }
  };

  const handlePublish = async () => {
    if (!publishId.trim()) return;
    try {
      await run(quizApi.update, publishId.trim(), { isPublished: true });
      toast.success('Quiz published');
    } catch (e) { toast.error(e.message); }
  };

  const DIFF_OPTS = ['easy','medium','hard'].map(v=>({value:v,label:v}));
  const TYPE_OPTS = ['mcq','multiCorrect','mixed'].map(v=>({value:v,label:v}));

  return (
    <div className="fade-in">
      <PageHeader title="Quiz Builder" desc="Create quizzes and link them to sections via quizId" />

      <div className="quiz-layout">
        <div className="quiz-main">
          {/* Meta */}
          <Card title="Quiz Info" style={{ marginBottom: 16 }}>
            <div className="form-stack">
              <FormInput label="Title *" value={quiz.title} onChange={e => setField('title', e.target.value)} placeholder="Lathe Machine — Basic Quiz" />
              <FormInput label="Description" type="textarea" value={quiz.description} onChange={e => setField('description', e.target.value)} />
              <div className="form-row">
                <SelectInput label="Quiz Type" value={quiz.quizType} onChange={e => setField('quizType', e.target.value)} options={TYPE_OPTS} />
                <SelectInput label="Difficulty" value={quiz.difficulty} onChange={e => setField('difficulty', e.target.value)} options={[...DIFF_OPTS, {value:'mixed',label:'mixed'}]} />
              </div>
              <div className="form-row">
                <FormInput label="Passing Score (%)" type="number" value={quiz.passingScore} onChange={e => setField('passingScore', Number(e.target.value))} />
                <FormInput label="Time Limit (sec, 0=none)" type="number" value={quiz.timeLimitSeconds} onChange={e => setField('timeLimitSeconds', Number(e.target.value))} />
              </div>
              <FormInput label="Tags (comma separated)" value={quiz.tags} onChange={e => setField('tags', e.target.value)} placeholder="lathe, cnc, turning" />
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer' }}>
                  <input type="checkbox" checked={quiz.shuffleQuestions} onChange={e => setField('shuffleQuestions', e.target.checked)} />
                  Shuffle Questions
                </label>
                <label style={{ display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer' }}>
                  <input type="checkbox" checked={quiz.showExplanation} onChange={e => setField('showExplanation', e.target.checked)} />
                  Show Explanation
                </label>
              </div>
            </div>
          </Card>

          {/* Questions */}
          {quiz.questions.map((q, qi) => (
            <Card
              key={qi}
              title={`Q${qi + 1}`}
              action={
                quiz.questions.length > 1
                  ? <Btn size="sm" variant="danger" onClick={() => removeQ(qi)}>Remove</Btn>
                  : null
              }
              style={{ marginBottom: 12 }}
            >
              <div className="form-stack">
                <FormInput
                  label="Question *"
                  type="textarea"
                  value={q.question}
                  onChange={e => setQField(qi, 'question', e.target.value)}
                  placeholder="What is the primary function of a lathe machine?"
                />

                <div>
                  <label className="form-label" style={{ marginBottom: 8, display:'block' }}>
                    Options — click circle to mark correct
                  </label>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="quiz-option">
                      <button
                        className={`quiz-correct-btn ${q.correctOptionIndexes.includes(oi) ? 'correct' : ''}`}
                        onClick={() => toggleCorrect(qi, oi)}
                        title="Mark as correct"
                      >
                        {q.correctOptionIndexes.includes(oi) ? '✓' : oi + 1}
                      </button>
                      <input
                        className="form-input"
                        value={opt.text}
                        onChange={e => setOptionText(qi, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                        style={{ flex: 1 }}
                      />
                      {q.options.length > 2 && (
                        <button className="quiz-remove-opt" onClick={() => removeOption(qi, oi)}>✕</button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 6 && (
                    <Btn size="sm" variant="ghost" onClick={() => addOption(qi)} style={{ marginTop: 8 }}>
                      + Add Option
                    </Btn>
                  )}
                </div>

                <FormInput
                  label="Explanation (shown after submit)"
                  type="textarea"
                  value={q.explanation}
                  onChange={e => setQField(qi, 'explanation', e.target.value)}
                  placeholder="The lathe rotates the workpiece..."
                />

                <div className="form-row">
                  <SelectInput label="Difficulty" value={q.difficulty} onChange={e => setQField(qi,'difficulty',e.target.value)} options={DIFF_OPTS} />
                  <FormInput label="Points" type="number" value={q.points} onChange={e => setQField(qi,'points',Number(e.target.value))} />
                </div>
              </div>
            </Card>
          ))}

          <div style={{ display:'flex', gap:10, marginBottom:24 }}>
            <Btn variant="ghost" onClick={addQuestion}>+ Add Question</Btn>
            <Btn onClick={handleSave} loading={loading}>Save Quiz</Btn>
          </div>
        </div>

        {/* Sidebar panel */}
        <div className="quiz-sidebar">
          <Card title="Summary">
            <div className="quiz-summary">
              <div className="qs-row"><span>Questions</span><strong>{quiz.questions.length}</strong></div>
              <div className="qs-row"><span>Type</span><Badge color="blue">{quiz.quizType}</Badge></div>
              <div className="qs-row"><span>Pass Score</span><strong>{quiz.passingScore}%</strong></div>
              <div className="qs-row"><span>Time Limit</span><strong>{quiz.timeLimitSeconds || '∞'} sec</strong></div>
            </div>
          </Card>

          {savedQuiz && (
            <Card title="✓ Saved">
              <p style={{ fontSize: 12, color:'var(--gray-500)', marginBottom: 8 }}>Copy this ID to link quiz to a section:</p>
              <div className="quiz-id-box">{savedQuiz._id}</div>
              <Btn size="sm" variant="ghost" style={{ marginTop:8, width:'100%' }} onClick={() => navigator.clipboard.writeText(savedQuiz._id)}>
                Copy ID
              </Btn>
            </Card>
          )}

          <Card title="Publish Existing Quiz">
            <div className="form-stack">
              <FormInput label="Quiz ID" value={publishId} onChange={e => setPublishId(e.target.value)} placeholder="MongoDB ObjectId" />
              <Btn onClick={handlePublish} loading={loading}>Publish</Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
