import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
  Home, Check, Circle, Video, ChevronDown, ChevronRight, ExternalLink,
  Tag, Search, StickyNote, Lightbulb, KeyRound, RotateCcw, Save,
} from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import { fetchLesson, fetchModule, saveProgress, fetchProgress } from '@/lib/api';

// Converte URL do YouTube para URL de embed
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // youtube.com/watch?v=ID
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    }
    // youtu.be/ID
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    // youtube.com/embed/... - já é embed
    if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/embed/')) {
      return url;
    }
  } catch (_) {}
  return null; // não é YouTube, retorna null para usar link externo
}

export default function LearnPage() {
  const router = useRouter();
  const { moduleId, lessonId } = router.query;

  const [lesson, setLesson] = useState(null);
  const [moduleData, setModuleData] = useState(null);
  const [currentCode, setCurrentCode] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState('');

  useEffect(() => {
    if (!moduleId || !lessonId) return;

    async function load() {
      try {
        const [lessonData, modData, progress] = await Promise.all([
          fetchLesson(moduleId, lessonId),
          fetchModule(moduleId),
          fetchProgress(),
        ]);
        setLesson(lessonData);
        setModuleData(modData);
        setCurrentCode(progress[lessonId]?.code || lessonData.starterCode || '');
        setCompleted(progress[lessonId]?.completed || false);
        setNotes(progress[lessonId]?.notes || '');
      } catch (err) {
        console.error('Erro ao carregar lição:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [moduleId, lessonId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProgress(lessonId, { code: currentCode, completed, notes });
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);
    setSaving(true);
    try {
      await saveProgress(lessonId, { code: currentCode, completed: newCompleted, notes });
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSolution = () => {
    if (lesson?.solution) {
      setCurrentCode(lesson.solution);
      setShowSolution(true);
    }
  };

  const handleResetCode = () => {
    if (lesson?.starterCode) {
      setCurrentCode(lesson.starterCode);
      setShowSolution(false);
    }
  };

  // Navegação entre lições
  const currentLessonIndex = moduleData?.lessons?.findIndex((l) => l.id === lessonId) ?? -1;
  const prevLesson = currentLessonIndex > 0 ? moduleData.lessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex < (moduleData?.lessons?.length || 0) - 1
      ? moduleData.lessons[currentLessonIndex + 1]
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="w-7 h-7 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-[var(--text-secondary)]">Lição não encontrada.</p>
          <Link href="/" className="text-[var(--accent)] hover:underline mt-2 inline-block">
            ← Voltar aos módulos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
        <Link href="/" className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors">
          <Home size={14} /> Módulos
        </Link>
        <span>/</span>
        <span>{lesson.moduleTitle}</span>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-medium">{lesson.title}</span>
      </div>

      {/* Main Grid: Content + IDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Lesson Content */}
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{lesson.title}</h1>
              <button
                onClick={handleComplete}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  completed
                    ? 'bg-[var(--success)] text-white'
                    : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-white'
                }`}
              >
                {completed ? <><Check size={16} strokeWidth={2.5} /> Concluída</> : <><Circle size={16} /> Marcar como concluída</>}
              </button>
            </div>

            <div className="lesson-content">
              <ReactMarkdown>{lesson.content}</ReactMarkdown>
            </div>
          </div>

          {/* Video Aula */}
          {lesson.videoUrl && (
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => setShowVideo(!showVideo)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[var(--bg-hover)]/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Video size={17} className="text-[var(--accent)]" />
                  <span className="text-sm font-semibold">Videoaula</span>
                  {getYouTubeEmbedUrl(lesson.videoUrl) ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/30">YouTube</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30">Link externo</span>
                  )}
                </div>
                <span className="text-[var(--text-secondary)]">{showVideo ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
              </button>
              {showVideo && (
                getYouTubeEmbedUrl(lesson.videoUrl) ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={getYouTubeEmbedUrl(lesson.videoUrl)}
                      title="Videoaula"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="px-5 pb-4">
                    <a
                      href={lesson.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                    >
                      <ExternalLink size={15} /> Abrir videoaula em nova aba
                    </a>
                  </div>
                )
              )}
            </div>
          )}

          {/* Keywords */}
          {lesson.keywords && lesson.keywords.length > 0 && (
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  <Tag size={13} /> Palavras-chave
                </h3>
              </div>
              {/* Busca dentro das palavras-chave */}
              <div className="relative mb-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  placeholder="Filtrar palavras-chave..."
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg pl-8 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.keywords
                  .filter((kw) => kw.toLowerCase().includes(keywordSearch.toLowerCase()))
                  .map((kw, i) => (
                    <Link
                      key={i}
                      href={`/search?q=${encodeURIComponent(kw)}`}
                      className="text-sm px-3 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-medium hover:bg-[var(--accent)] hover:text-white transition-colors"
                      title={`Buscar outras lições com “${kw}”`}
                    >
                      {kw}
                    </Link>
                  ))
                }
                {keywordSearch && lesson.keywords.filter((kw) => kw.toLowerCase().includes(keywordSearch.toLowerCase())).length === 0 && (
                  <p className="text-xs text-[var(--text-secondary)] italic">Nenhuma palavra-chave encontrada.</p>
                )}
              </div>
              {keywordSearch === '' && (
                <p className="text-xs text-[var(--text-secondary)] mt-2 opacity-60">
                  Clique em uma palavra-chave para buscar outras lições relacionadas.
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              <StickyNote size={13} /> Minhas Anotações
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSave}
              placeholder="Escreva suas anotações sobre esta lição... (salva automaticamente)"
              rows={5}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-y"
            />
          </div>

          {/* Hints */}
          {lesson.hints && lesson.hints.length > 0 && (
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4">
              <button
                onClick={() => setShowHints(!showHints)}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--warning)] hover:opacity-80 transition-opacity"
              >
                <Lightbulb size={16} /> {showHints ? 'Esconder Dicas' : 'Mostrar Dicas'}
              </button>
              {showHints && (
                <div className="mt-3 space-y-2">
                  {lesson.hints.map((hint, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border-soft)] p-3 rounded-lg"
                    >
                      <Lightbulb size={15} className="text-[var(--warning)] mt-0.5 shrink-0" />
                      <span>{hint}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleLoadSolution}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all"
            >
              <KeyRound size={15} /> Ver Solução
            </button>
            <button
              onClick={handleResetCode}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--warning)] transition-all"
            >
              <RotateCcw size={15} /> Resetar Código
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--success)] transition-all"
            >
              <Save size={15} /> {saving ? 'Salvando...' : 'Salvar Código'}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            {prevLesson ? (
              <Link
                href={`/learn/${moduleId}/${prevLesson.id}`}
                className="flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
              >
                ← {prevLesson.title}
              </Link>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Link
                href={`/learn/${moduleId}/${nextLesson.id}`}
                className="flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
              >
                {nextLesson.title} →
              </Link>
            ) : (
              <Link href="/" className="text-sm text-[var(--success)] font-medium hover:underline">
                Voltar aos Módulos
              </Link>
            )}
          </div>
        </div>

        {/* Right: Code Editor (IDE) */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <CodeEditor
            initialCode={currentCode}
            language={lesson.language}
            onCodeChange={setCurrentCode}
            height="450px"
          />
        </div>
      </div>
    </div>
  );
}
