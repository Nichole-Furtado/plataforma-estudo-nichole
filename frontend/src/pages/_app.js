import '@/styles/globals.css';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '@/lib/auth';

const PUBLIC_ROUTES = ['/login'];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isPublic = PUBLIC_ROUTES.includes(router.pathname);
    if (isPublic) {
      setReady(true);
      return;
    }
    if (!isAuthenticated()) {
      router.replace('/login');
      // não marca como ready para evitar flash de conteúdo protegido
    } else {
      setReady(true);
    }
  }, [router.pathname]);

  const isLogin = router.pathname === '/login';

  // Evita flash de conteúdo antes da verificação de auth
  if (!ready && !isLogin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} />
    );
  }

  return (
    <>
      <Head>
        <title>Plataforma de Estudo da Nichole</title>
        <meta name="description" content="Plataforma de estudo interativa com IDE no navegador" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%236366f1'/><text x='50' y='54' font-size='60' font-family='Arial,sans-serif' font-weight='700' fill='white' text-anchor='middle' dominant-baseline='central'>N</text></svg>"
        />
      </Head>
      {isLogin ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </>
  );
}
