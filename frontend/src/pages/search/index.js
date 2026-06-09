import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Search, SearchX, Tag, ArrowRight } from 'lucide-react';
import { searchByKeyword } from '@/lib/api';

export default function SearchPage() {
  const router = useRouter();
  const { q: initialQuery } = router.query;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  // Inicializa com query da URL
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      doSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // Foca o input ao abrir
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q || !q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchByKeyword(q.trim());
      setResults(data);
    } catch (err) {
      console.error('Erro na busca:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`, undefined, { shallow: true });
    doSearch(query);
  };

  const handleKeywordClick = (kw) => {
    setQuery(kw);
    router.push(`/search?q=${encodeURIComponent(kw)}`, undefined, { shallow: true });
    doSearch(kw);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 tracking-tight">Buscar por palavras-chave</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Encontre lições pelo tema, conceito ou palavra-chave cadastrada.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: funções, loops, variáveis, recursão..."
          className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            : <Search size={16} />}
          Buscar
        </button>
      </form>

      {/* Results */}
      {loading && (
        <div className="flex flex-col items-center py-12 gap-3">
          <span className="w-7 h-7 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Buscando...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 card-surface rounded-2xl">
          <SearchX size={32} className="mx-auto mb-3 text-[var(--text-secondary)] opacity-60" />
          <h2 className="text-lg font-semibold mb-1">Nenhum resultado encontrado</h2>
          <p className="text-[var(--text-secondary)] text-sm">
            Tente outra palavra-chave ou cadastre palavras-chave nas lições{' '}
            <Link href="/admin" className="text-[var(--accent)] hover:underline">
              em Gerenciar
            </Link>
            .
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            <span className="font-semibold text-[var(--text-primary)]">{results.length}</span> resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''} para{' '}
            <span className="text-[var(--accent)] font-medium">&quot;{query}&quot;</span>
          </p>

          {results.map((item) => (
            <Link
              key={`${item.moduleId}-${item.lessonId}`}
              href={`/learn/${item.moduleId}/${item.lessonId}`}
              className="block card-surface rounded-2xl p-5 hover:border-[var(--accent)] hover:bg-[var(--bg-hover)]/40 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 mt-0.5 rounded-lg flex items-center justify-center bg-[var(--accent-soft)] text-[var(--accent)] shrink-0">
                  <Tag size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">
                    {item.moduleTitle} •{' '}
                    <span className="text-[var(--accent)]">{item.moduleLanguage}</span>
                  </p>
                  <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {item.lessonTitle}
                  </h3>
                  {item.lessonDescription && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                      {item.lessonDescription}
                    </p>
                  )}
                  {item.keywords && item.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.keywords.map((kw, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.preventDefault();
                            handleKeywordClick(kw);
                          }}
                          className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                            item.matchedKeywords?.includes(kw)
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                              : 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30 hover:bg-[var(--accent)]/20'
                          }`}
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <ArrowRight size={18} className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {!searched && (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <Tag size={34} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">
            Digite uma palavra-chave acima e pressione Buscar.
          </p>
          <p className="text-xs mt-2 opacity-60">
            As palavras-chave são cadastradas em cada lição na aba{' '}
            <Link href="/admin" className="text-[var(--accent)] hover:underline">
              Gerenciar
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
