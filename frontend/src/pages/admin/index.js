import { useState, useEffect } from 'react';
import {
  Plus, X, Check, Trash2, Inbox, ChevronDown, ChevronRight, Code2, Video,
} from 'lucide-react';
import {
  fetchModules,
  createModule,
  deleteModule,
  createLesson,
  deleteLesson,
} from '@/lib/api';

export default function AdminPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState(null);

  // Forms
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', language: 'python', icon: '', startDate: '', endDate: '' });

  const [showLessonForm, setShowLessonForm] = useState(null); // moduleId or null
  const [lessonForm, setLessonForm] = useState({
    title: '', description: '', content: '', starterCode: '', solution: '', hints: '', keywords: '', videoUrl: '',
  });

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await fetchModules();
      setModules(data);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  // ========= MODULE CRUD =========

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim()) return alert('Título é obrigatório');
    try {
      await createModule(moduleForm);
      setModuleForm({ title: '', description: '', language: 'python', icon: '', startDate: '', endDate: '' });
      setShowModuleForm(false);
      loadModules();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteModule = async (moduleId, title) => {
    if (!confirm(`Tem certeza que deseja excluir o módulo "${title}"?\nTodas as lições serão removidas!`)) return;
    try {
      await deleteModule(moduleId);
      loadModules();
    } catch (err) {
      alert(err.message);
    }
  };

  // ========= LESSON CRUD =========

  const handleCreateLesson = async (moduleId) => {
    if (!lessonForm.title.trim()) return alert('Título da lição é obrigatório');
    try {
      const data = {
        ...lessonForm,
        hints: lessonForm.hints ? lessonForm.hints.split('\n').filter((h) => h.trim()) : [],
        keywords: lessonForm.keywords ? lessonForm.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
        videoUrl: lessonForm.videoUrl.trim(),
      };
      await createLesson(moduleId, data);
      setLessonForm({ title: '', description: '', content: '', starterCode: '', solution: '', hints: '', keywords: '', videoUrl: '' });
      setShowLessonForm(null);
      loadModules();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId, title) => {
    if (!confirm(`Excluir a lição "${title}"?`)) return;
    try {
      await deleteLesson(moduleId, lessonId);
      loadModules();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="w-7 h-7 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gerenciar Conteúdo</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">
            Crie, edite e exclua módulos e lições da plataforma.
          </p>
        </div>
        <button
          onClick={() => setShowModuleForm(!showModuleForm)}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors"
        >
          {showModuleForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} strokeWidth={2.4} /> Novo Módulo</>}
        </button>
      </div>

      {/* Create Module Form */}
      {showModuleForm && (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--accent)] p-6 mb-6 fade-in">
          <h2 className="text-lg font-semibold mb-4">Criar Novo Módulo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Título *</label>
              <input
                type="text"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="Ex: Python - Avançado"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Linguagem *</label>
              <input
                type="text"
                list="language-list"
                value={moduleForm.language}
                onChange={(e) => setModuleForm({ ...moduleForm, language: e.target.value })}
                placeholder="Ex: python, javascript, sql..."
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
              />
              <datalist id="language-list">
                <option value="python" />
                <option value="javascript" />
                <option value="typescript" />
                <option value="html" />
                <option value="css" />
                <option value="sql" />
                <option value="react" />
                <option value="git" />
                <option value="java" />
                <option value="c#" />
              </datalist>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Descrição</label>
              <input
                type="text"
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Breve descrição do módulo..."
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Data inicial prevista</label>
              <input
                type="date"
                value={moduleForm.startDate}
                onChange={(e) => setModuleForm({ ...moduleForm, startDate: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Data final prevista</label>
              <input
                type="date"
                value={moduleForm.endDate}
                onChange={(e) => setModuleForm({ ...moduleForm, endDate: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreateModule}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[var(--success)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Check size={16} strokeWidth={2.5} /> Criar Módulo
            </button>
          </div>
        </div>
      )}

      {/* Modules List */}
      {modules.length === 0 ? (
        <div className="card-surface rounded-2xl p-12 text-center">
          <Inbox size={36} className="mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Nenhum módulo criado</h2>
          <p className="text-[var(--text-secondary)] text-sm">Clique em &quot;Novo Módulo&quot; para começar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden transition-all"
            >
              {/* Module Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-hover)]/50 transition-colors"
                onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--accent-soft)] text-[var(--accent)] shrink-0">
                    <Code2 size={18} />
                  </span>
                  <div>
                    <h3 className="font-semibold">{mod.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {mod.lessonCount} lições •{' '}
                      <span className="text-[var(--accent)]">{mod.language}</span>
                      {mod.startDate && (
                        <span className="ml-2 text-[var(--text-secondary)]">
                          {new Date(mod.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                          {mod.endDate && ` → ${new Date(mod.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteModule(mod.id, mod.title);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg text-[var(--error)] border border-[var(--error)]/30 hover:bg-[var(--error)]/10 transition-colors"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                  <span className="text-[var(--text-secondary)]">
                    {expandedModule === mod.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </span>
                </div>
              </div>

              {/* Expanded: Lessons */}
              {expandedModule === mod.id && (
                <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--bg-primary)]/30 fade-in">
                  {/* Lessons list */}
                  {mod.lessons.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)] py-2 text-center italic">
                      Nenhuma lição neste módulo.
                    </p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {mod.lessons.map((lesson, i) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between bg-[var(--bg-card)] rounded-xl px-4 py-2.5 border border-[var(--border)]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </span>
                            <div>
                              <span className="text-sm font-medium">{lesson.title}</span>
                              {lesson.description && (
                                <p className="text-xs text-[var(--text-secondary)]">{lesson.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                {lesson.videoUrl && (
                                  <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                                    <Video size={11} /> vídeo
                                  </span>
                                )}
                                {lesson.keywords && lesson.keywords.map((kw, ki) => (
                                  <span key={ki} className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]/80 border border-[var(--accent)]/20">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteLesson(mod.id, lesson.id, lesson.title)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors"
                            title="Excluir lição"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Lesson */}
                  {showLessonForm === mod.id ? (
                    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--accent)] p-4 mt-2 fade-in">
                      <h4 className="text-sm font-semibold mb-3">Nova Lição</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-[var(--text-secondary)] mb-1 block">Título *</label>
                            <input
                              type="text"
                              value={lessonForm.title}
                              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                              placeholder="Ex: Classes e Objetos"
                              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[var(--text-secondary)] mb-1 block">Descrição curta</label>
                            <input
                              type="text"
                              value={lessonForm.description}
                              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                              placeholder="Uma breve descrição..."
                              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                            Conteúdo da lição (Markdown)
                          </label>
                          <textarea
                            value={lessonForm.content}
                            onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                            placeholder="# Título da Lição&#10;&#10;Escreva o conteúdo em Markdown..."
                            rows={5}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-y"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                            Código inicial (starter code)
                          </label>
                          <textarea
                            value={lessonForm.starterCode}
                            onChange={(e) => setLessonForm({ ...lessonForm, starterCode: e.target.value })}
                            placeholder="# Código que aparece no editor..."
                            rows={4}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-y"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--text-secondary)] mb-1 block">Solução</label>
                          <textarea
                            value={lessonForm.solution}
                            onChange={(e) => setLessonForm({ ...lessonForm, solution: e.target.value })}
                            placeholder="# Código da solução..."
                            rows={3}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-y"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                            Dicas (uma por linha)
                          </label>
                          <textarea
                            value={lessonForm.hints}
                            onChange={(e) => setLessonForm({ ...lessonForm, hints: e.target.value })}
                            placeholder="Primeira dica&#10;Segunda dica"
                            rows={2}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-y"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                            Palavras-chave (separadas por vírgula)
                          </label>
                          <input
                            type="text"
                            value={lessonForm.keywords}
                            onChange={(e) => setLessonForm({ ...lessonForm, keywords: e.target.value })}
                            placeholder="Ex: funções, loops, recursividade"
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
                          />
                          {lessonForm.keywords && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {lessonForm.keywords.split(',').map((k) => k.trim()).filter(Boolean).map((kw, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                            Link da Videoaula (YouTube ou outro)
                          </label>
                          <input
                            type="url"
                            value={lessonForm.videoUrl}
                            onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
                          />
                          {lessonForm.videoUrl && (
                            <p className="text-xs text-[var(--success)] mt-1">Link adicionado — o player aparecerá na lição</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowLessonForm(null);
                            setLessonForm({ title: '', description: '', content: '', starterCode: '', solution: '', hints: '', keywords: '', videoUrl: '' });
                          }}
                          className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleCreateLesson(mod.id)}
                          className="flex items-center gap-1.5 px-5 py-2 bg-[var(--success)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                          <Check size={15} strokeWidth={2.5} /> Criar Lição
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLessonForm(mod.id)}
                      className="w-full mt-2 py-2.5 flex items-center justify-center gap-1.5 text-sm text-[var(--accent)] border border-dashed border-[var(--accent)]/40 rounded-xl hover:bg-[var(--accent)]/5 transition-colors"
                    >
                      <Plus size={15} strokeWidth={2.4} /> Adicionar Lição
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
