import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { WalletProvider } from './hooks/useWallet';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </StrictMode>,
);
