import '@/styles/globals.css';
import Head from 'next/head';
import Layout from '@/components/Layout';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Plataforma de Estudo da Nichole</title>
        <meta name="description" content="Plataforma de estudo interativa com IDE no navegador" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%236366f1'/><text x='50' y='54' font-size='60' font-family='Arial,sans-serif' font-weight='700' fill='white' text-anchor='middle' dominant-baseline='central'>N</text></svg>" />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
