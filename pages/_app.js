import '../styles/globals.css';
import { UserProvider } from '../utils/context';
import TelegramScript from '../components/TelegramScript';
import SwipeHandler from '../components/SwipeHandler';

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <TelegramScript />
      <SwipeHandler>
        <Component {...pageProps} />
      </SwipeHandler>
    </UserProvider>
  );
}

export default MyApp; 