import '../styles/globals.css';
import { UserProvider } from '../utils/context';
import TelegramScript from '../components/TelegramScript';

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <TelegramScript />
      <Component {...pageProps} />
    </UserProvider>
  );
}

export default MyApp; 