import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
  address: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const anyWindow = window as any;
      const provider = anyWindow.ethereum || anyWindow.okxwallet || anyWindow.rabby;
      if (typeof window !== 'undefined' && provider) {
        try {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          }
        } catch (error) {
          console.error("Failed to get accounts", error);
        }
      }
    };
    checkConnection();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        setAddress(null);
      }
    };

    if (typeof window !== 'undefined') {
      const anyWindow = window as any;
      const provider = anyWindow.ethereum || anyWindow.okxwallet || anyWindow.rabby;
      if (provider) {
        provider.on('accountsChanged', handleAccountsChanged);
        return () => {
          provider.removeListener('accountsChanged', handleAccountsChanged);
        };
      }
    }
  }, []);

  const connect = async () => {
    const anyWindow = window as any;
    const provider = anyWindow.ethereum || anyWindow.okxwallet || anyWindow.rabby;
    if (typeof window === 'undefined' || !provider) {
      alert('No Web3 wallet detected. Please install MetaMask, Rabby, or OKX Wallet to connect.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (error) {
      console.error("Connection error", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
  };

  return (
    <WalletContext.Provider value={{ address, isConnecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
