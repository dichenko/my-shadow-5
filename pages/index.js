import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import LoadingScreen from '../components/LoadingScreen';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Перенаправляем на страницу с вопросами
    router.replace('/questions');
  }, [router]);

  return (
    <div>
      <Head>
        <title>MyShadowApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="MyShadowApp - Telegram WebApp" />
      </Head>

      <LoadingScreen timeout={10000} />
    </div>
  );
} 