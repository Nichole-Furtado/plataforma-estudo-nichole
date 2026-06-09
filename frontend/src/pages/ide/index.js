import { useState } from 'react';
import { Keyboard, Timer, ShieldCheck } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';

const TEMPLATES = {
  python: {
    label: 'Python',
    code: `# Python - IDE Livre
# Escreva seu código Python aqui!

def main():
    print("Olá! Bem-vinda à IDE Livre.")
    print("Escreva qualquer código Python aqui.")

    # Exemplo: lista de compras
    compras = ["maçã", "banana", "leite", "pão"]
    for item in compras:
        print(f"  - {item}")
    
    print(f"\\nTotal de itens: {len(compras)}")

main()
`,
  },
  javascript: {
    label: 'JavaScript',
    code: `// JavaScript - IDE Livre
// Escreva seu código JavaScript aqui!

function main() {
    console.log("Olá! Bem-vinda à IDE Livre.");
    console.log("Escreva qualquer código JavaScript aqui.");
    
    // Exemplo: calculadora de gorjeta
    const conta = 85.50;
    const gorjeta = 0.15;
    const total = conta + (conta * gorjeta);
    
    console.log(\`\\nConta: R$ \${conta.toFixed(2)}\`);
    console.log(\`Gorjeta (15%): R$ \${(conta * gorjeta).toFixed(2)}\`);
    console.log(\`Total: R$ \${total.toFixed(2)}\`);
}

main();
`,
  },
};

export default function IDEPage() {
  const [language, setLanguage] = useState('python');
  const [editorKey, setEditorKey] = useState(0);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setEditorKey((prev) => prev + 1); // Força re-render do editor
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">IDE Livre</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Escreva e execute código livremente. Perfeito para experimentar e praticar.
        </p>
      </div>

      {/* Language Selector */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-[var(--text-secondary)]">Linguagem:</span>
        {Object.entries(TEMPLATES).map(([lang, { label }]) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={`text-sm px-4 py-2 rounded-lg font-semibold transition-all ${
              language === lang
                ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <CodeEditor
        key={editorKey}
        initialCode={TEMPLATES[language].code}
        language={language}
        height="500px"
      />

      {/* Tips */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { Icon: Keyboard, title: 'Atalho', body: <>Pressione <kbd className="px-1.5 py-0.5 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-xs">Ctrl+Enter</kbd> para executar o código rapidamente.</> },
          { Icon: Timer, title: 'Tempo limite', body: 'A execução tem limite de 15 segundos. Cuidado com loops infinitos.' },
          { Icon: ShieldCheck, title: 'Sandbox', body: 'O código roda em ambiente isolado no servidor. Seguro para experimentar.' },
        ].map(({ Icon, title, body }) => (
          <div key={title} className="card-surface rounded-xl p-4">
            <Icon size={18} className="text-[var(--accent)] mb-2" />
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
