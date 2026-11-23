import { Html, Head, Main, NextScript } from 'next/document';

/*
 * Aplica o tema antes da página pintar, senão apareceria um piscão escuro
 * para quem escolheu o claro. Roda como primeiro elemento do <body>.
 * O escuro é o padrão: se o localStorage falhar (modo privado, por exemplo),
 * cai no escuro, que é o que o :root já define no CSS.
 */
const aplicarTema = `
(function () {
  try {
    var t = localStorage.getItem('nichole_theme');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function Document() {
  return (
    <Html lang="pt-BR" data-theme="dark">
      <Head />
      <body>
        <script dangerouslySetInnerHTML={{ __html: aplicarTema }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
