import TelegramScript from '../components/TelegramScript';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <TelegramScript />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp; 