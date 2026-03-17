'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { foundry } from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query';

// Define the configuration for your dApp
const config = getDefaultConfig({
  appName: 'Meme Coin Launchpad',
  projectId: '6683052828f050855b5e7552e502bd3d', // Get this for free from cloud.walletconnect.com
  chains: [sepolia], // We are strictly targeting the Sepolia testnet
  ssr: true, // Crucial for Next.js server-side rendering
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#ffffff',
          accentColorForeground: '#000000',
          borderRadius: 'medium',
          overlayBlur: 'none',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}