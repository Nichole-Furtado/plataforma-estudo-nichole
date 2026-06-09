import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Code2, Check } from 'lucide-react';
import { fetchModules, fetchProgress } from '@/lib/api';

export default function Home() {
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [mods, prog] = await Promise.all([fetchModules(), fetchProgress()]);
        setModules(mods);
        setProgress(prog);
      } catch (err) {
        console.error('Erro ao carregar módulos:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getModuleProgress = (mod) => {
    const completed = mod.lessons.filter((l) => progress[l.id]?.completed).length;
    return { completed, total: mod.lessons.length, percent: Math.round((completed / mod.lessons.length) * 100) };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="w-7 h-7 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
          Olá, Nichole!
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
          Sua plataforma de estudo pessoal com IDE integrada.
          Escolha um módulo e comece a programar agora mesmo!
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <div className="bg-[var(--bg-card)] rounded-xl px-6 py-3 border border-[var(--border)]">
            <span className="text-2xl font-bold text-[var(--accent)]">{modules.length}</span>
            <span className="text-sm text-[var(--text-secondary)] ml-2">Módulos</span>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl px-6 py-3 border border-[var(--border)]">
            <span className="text-2xl font-bold text-[var(--success)]">
              {modules.reduce((acc, m) => acc + m.lessonCount, 0)}
            </span>
            <span className="text-sm text-[var(--text-secondary)] ml-2">Lições</span>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl px-6 py-3 border border-[var(--border)]">
            <span className="text-2xl font-bold text-[var(--warning)]">
              {Object.values(progress).filter((p) => p.completed).length}
            </span>
            <span className="text-sm text-[var(--text-secondary)] ml-2">Concluídas</span>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod, index) => {
          const prog = getModuleProgress(mod);
          return (
            <div
              key={mod.id}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] hover:border-[var(--accent)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent)]/5 fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="w-11 h-11 mb-3 rounded-xl flex items-center justify-center bg-[var(--accent-soft)] text-[var(--accent)]">
                      <Code2 size={22} strokeWidth={2} />
                    </span>
                    <h2 className="text-xl font-bold">{mod.title}</h2>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      mod.language === 'python' ? 'badge-python' : 'badge-javascript'
                    }`}
                  >
                    {mod.language === 'python' ? 'Python' : 'JavaScript'}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] text-sm mb-4">{mod.description}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-secondary)]">
                      {prog.completed}/{prog.total} lições
                    </span>
                    <span className="text-[var(--accent)]">{prog.percent}%</span>
                  </div>
                  <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] rounded-full transition-all duration-500"
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                </div>

                {/* Lessons List */}
                <div className="space-y-2">
                  {mod.lessons.map((lesson, i) => (
                    <Link
                      key={lesson.id}
                      href={`/learn/${mod.id}/${lesson.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors group"
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          progress[lesson.id]?.completed
                            ? 'bg-[var(--success)] text-white'
                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] group-hover:bg-[var(--accent)] group-hover:text-white'
                        } transition-colors`}
                      >
                        {progress[lesson.id]?.completed ? <Check size={13} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="text-sm group-hover:text-[var(--accent)] transition-colors">
                        {lesson.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
