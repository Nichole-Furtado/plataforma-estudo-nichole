import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Play, Square, Eraser } from 'lucide-react';
import { useSocket } from '@/lib/useSocket';

// Monaco Editor precisa ser carregado sem SSR
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function CodeEditor({
  initialCode = '',
  language = 'python',
  onCodeChange,
  height = '400px',
}) {
  const [code, setCode] = useState(initialCode);
  const { connected, output, running, execute, kill, clearOutput } = useSocket();
  const outputRef = useRef(null);

  // Atualizar código quando initialCode muda
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  // Auto-scroll do output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleEditorChange = (value) => {
    setCode(value || '');
    onCodeChange?.(value || '');
  };

  const handleRun = () => {
    clearOutput();
    execute(code, language);
  };

  const handleStop = () => {
    kill();
  };

  const monacoLanguage = language === 'python' ? 'python' : 'javascript';

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-[var(--code-border)] bg-[var(--code-bg)] shadow-[var(--shadow-md)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--code-surface)] border-b border-[var(--code-border)]">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            language === 'python' ? 'badge-python' : 'badge-javascript'
          }`}>
            {language === 'python' ? 'Python' : 'JavaScript'}
          </span>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[var(--success)]' : 'bg-[var(--error)]'}`} 
               title={connected ? 'Conectado' : 'Desconectado'} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearOutput}
            className="flex items-center gap-1 text-xs text-[var(--code-text-dim)] hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
            title="Limpar console"
          >
            <Eraser size={14} /> Limpar
          </button>
          {running ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg bg-[var(--error)] text-white hover:opacity-90 transition-opacity"
            >
              <Square size={14} fill="currentColor" /> Parar
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={!connected || !code.trim()}
              className="btn-run text-sm"
            >
              <Play size={15} fill="currentColor" /> Executar
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div style={{ height }}>
        <MonacoEditor
          height="100%"
          language={monacoLanguage}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            suggest: { showWords: true },
            tabSize: 4,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
          }}
          beforeMount={(monaco) => {
            // Tema personalizado
            monaco.editor.defineTheme('nichole-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
                { token: 'string', foreground: '9ecbff' },
                { token: 'keyword', foreground: 'f97583' },
                { token: 'number', foreground: '79b8ff' },
                { token: 'type', foreground: 'b392f0' },
              ],
              colors: {
                'editor.background': '#1a1b2e',
                'editor.foreground': '#e2e4f0',
                'editor.lineHighlightBackground': '#252640',
                'editor.selectionBackground': '#3b5bdb44',
                'editorCursor.foreground': '#5c7cfa',
                'editorLineNumber.foreground': '#5c5f66',
                'editorLineNumber.activeForeground': '#5c7cfa',
              },
            });
          }}
          onMount={(editor, monaco) => {
            monaco.editor.setTheme('nichole-dark');
            // Atalho Ctrl+Enter para executar
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
              handleRun();
            });
          }}
        />
      </div>

      {/* Output Console */}
      <div className="border-t border-[var(--code-border)]">
        <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--code-surface)]">
          <span className="text-xs font-semibold text-[var(--code-text-dim)] uppercase tracking-wider">Console</span>
          {running && (
            <span className="text-xs text-[var(--warning)] flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-[var(--warning)]/40 border-t-[var(--warning)] animate-spin" /> Executando...
            </span>
          )}
        </div>
        <div
          ref={outputRef}
          className="terminal-output p-4 max-h-[200px] min-h-[80px] overflow-y-auto bg-[var(--code-bg)]"
        >
          {output.length === 0 ? (
            <span className="text-[var(--code-text-dim)] text-xs italic">
              Clique em &quot;Executar&quot; ou pressione Ctrl+Enter para rodar o código...
            </span>
          ) : (
            output.map((item, i) => (
              <span key={i} className={item.type}>
                {item.data}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
