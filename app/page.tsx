"use client";

import Script from "next/script";
import Link from "next/link"; // <-- ADDED THIS IMPORT
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { createPublicClient, fallback, http, parseAbiItem, type Abi } from "viem";
import {sepolia } from "viem/chains";
import { DEPLOYMENT_BLOCK, LAUNCHPAD_ADDRESS } from "./constant";

// 1. IMPORT YOUR ABI (Crucial for reading the 'coins' mapping)
import launchpadArtifact from '../contracts/out/Counter.sol/MemeCoinLaunchPad.json';

const launchpadAbi = launchpadArtifact.abi as Abi;
const LOG_RANGE = BigInt(900);

const coinCreatedEvent = parseAbiItem('event CoinCreated(address indexed tokenAddress, address indexed creator, string name, string symbol)');
const coinPurchasedEvent = parseAbiItem('event CoinPurchased(address indexed coin, address indexed buyer, uint256 amount, uint256 cost)');

const publicClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    http("https://ethereum-sepolia-rpc.publicnode.com", { retryCount: 1, timeout: 8000 }),
    http("https://sepolia.gateway.tenderly.co", { retryCount: 1, timeout: 8000 }),
    http("https://rpc.sepolia.org", { retryCount: 1, timeout: 8000 }),
  ])
});

// Upgraded Token type
type Token = {
  address: string;
  creator: string;
  name: string;
  symbol: string;
  isMatured?: boolean;
  tokensSold?: string;
};

const isValidAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);

async function getLogsInChunks(params: {
  address: `0x${string}`;
  event: ReturnType<typeof parseAbiItem>;
  args?: Record<string, unknown>;
}) {
  const latestBlock = await publicClient.getBlockNumber();
  if (DEPLOYMENT_BLOCK > latestBlock) return [];

  const allLogs: any[] = [];
  for (let fromBlock = DEPLOYMENT_BLOCK; fromBlock <= latestBlock; fromBlock += LOG_RANGE + BigInt(1)) {
    const toBlock = fromBlock + LOG_RANGE > latestBlock ? latestBlock : fromBlock + LOG_RANGE;
    const logs = await publicClient.getLogs({
      address: params.address,
      event: params.event,
      args: params.args,
      fromBlock,
      toBlock,
    } as any);
    allLogs.push(...logs);
  }

  return allLogs;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  
  // 2. Separate State for all three columns
  const [initialisedTokens, setInitialisedTokens] = useState<Token[]>([]);
  const [maturedTokens, setMaturedTokens] = useState<Token[]>([]);
  const [myTokens, setMyTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 3. The Master Fetch Function
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        // A. GET ALL CREATED TOKENS
        const creationLogs = await getLogsInChunks({
          address: LAUNCHPAD_ADDRESS as `0x${string}`,
          event: coinCreatedEvent,
        });

        // B. CHECK MATURITY STATUS FOR EVERY TOKEN
        const tokensWithStatus = await Promise.all(creationLogs.map(async (log) => {
          const coinAddress = log.args.tokenAddress as `0x${string}`;
          
          const data = await publicClient.readContract({
            address: LAUNCHPAD_ADDRESS as `0x${string}`,
            abi: launchpadAbi,
            functionName: 'coins',
            args: [coinAddress]
          }) as [string, bigint, boolean];

          return {
            address: coinAddress,
            creator: log.args.creator as string,
            name: log.args.name as string,
            symbol: log.args.symbol as string,
            tokensSold: data[1].toString(),
            isMatured: data[2] // This tells us which column it belongs in!
          };
        }));

        const reversedTokens = tokensWithStatus
          .filter((token) => isValidAddress(token.address))
          .reverse(); // Newest first

        // C. SPLIT INTO INITIALISED & MATURED COLUMNS
        setInitialisedTokens(reversedTokens.filter(t => !t.isMatured));
        setMaturedTokens(reversedTokens.filter(t => t.isMatured));

        // D. FIND "YOUR TOKENS" (Created or Bought)
        if (address) {
          const buyLogs = await getLogsInChunks({
            address: LAUNCHPAD_ADDRESS as `0x${string}`,
            event: coinPurchasedEvent,
            args: { buyer: address as `0x${string}` }, // Filter exactly by connected wallet
          });

          // Create a quick list of addresses the user bought
          const boughtAddresses = new Set(buyLogs.map(log => log.args.coin?.toLowerCase()));

          // Filter main list: Did they create it OR did they buy it?
          const userTokens = reversedTokens.filter(t => 
            t.creator.toLowerCase() === address.toLowerCase() || 
            boughtAddresses.has(t.address.toLowerCase())
          );
          setMyTokens(userTokens);
        } else {
          setMyTokens([]);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [address, isConnected]);

  return (
    <>
      {/* CoinGecko Scripts */}
      <Script src="https://widgets.coingecko.com/gecko-coin-price-marquee-widget.js" strategy="afterInteractive" />
      <Script src="https://widgets.coingecko.com/gecko-coin-compare-chart-widget.js" strategy="afterInteractive" />

      {/* Price Marquee */}
      <gecko-coin-price-marquee-widget locale="en" dark-mode="true" transparent-background="true" outlined="true" coin-ids="bitcoin,ethereum,solana" initial-currency="usd" />

      {/* Sections */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">

        {/* --- COLUMN 1: INITIALISED TOKENS --- */}
        <div className="border border-[#2a2a2a] bg-[#111] rounded-xl p-5 h-[60vh] flex flex-col hover:border-[#444] transition-colors">
          <h2 className="font-bold text-lg mb-3 text-white">Initialised Tokens</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {isLoading ? (
              <p className="text-gray-500 text-sm animate-pulse">Scanning Anvil blockchain...</p>
            ) : initialisedTokens.length === 0 ? (
              <p className="text-gray-500 text-sm border border-dashed border-[#2a2a2a] p-4 rounded text-center">No tokens launched yet.</p>
            ) : (
              initialisedTokens.map((token, index) => (
                <Link 
                  href={`/trade/${encodeURIComponent(token.address)}`} 
                  key={index} 
                  className="block bg-black border border-[#2a2a2a] p-4 rounded-lg hover:border-green-500/50 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-white group-hover:text-green-400 transition-colors">{token.name}</h3>
                    <span className="text-xs font-mono bg-[#222] px-2 py-1 rounded text-green-400">${token.symbol}</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Contract: <span className="text-gray-400 font-mono">{token.address.slice(0, 6)}...{token.address.slice(-4)}</span></p>
                    <p>Creator: <span className="text-gray-400 font-mono">{token.creator.slice(0, 6)}...{token.creator.slice(-4)}</span></p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* --- COLUMN 2: MATURED TOKENS --- */}
        <div className="border border-[#2a2a2a] bg-[#111] rounded-xl p-5 h-[60vh] flex flex-col hover:border-[#444] transition-colors">
          <h2 className="font-bold text-lg mb-3 text-white flex justify-between">
            Matured Tokens <span className="text-yellow-500 text-sm">🚀 Ready</span>
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {isLoading ? (
              <p className="text-gray-500 text-sm animate-pulse">Scanning Anvil blockchain...</p>
            ) : maturedTokens.length === 0 ? (
              <p className="text-gray-500 text-sm border border-dashed border-[#2a2a2a] p-4 rounded text-center">No tokens have reached maturity yet.</p>
            ) : (
              maturedTokens.map((token, index) => (
                <Link 
                  href={`/trade/${encodeURIComponent(token.address)}`} 
                  key={index} 
                  className="block bg-black border border-yellow-500/30 p-4 rounded-lg hover:border-yellow-500 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-white">{token.name}</h3>
                    <span className="text-xs font-mono bg-yellow-500/20 px-2 py-1 rounded text-yellow-400">${token.symbol}</span>
                  </div>
                  <p className="text-xs text-gray-500">Contract: <span className="text-gray-400 font-mono">{token.address.slice(0, 6)}...{token.address.slice(-4)}</span></p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* --- COLUMN 3: YOUR TOKENS --- */}
        <div className="border border-[#2a2a2a] bg-[#111] rounded-xl p-5 h-[60vh] flex flex-col hover:border-[#444] transition-colors">
          <h2 className="font-bold text-lg mb-3 text-white">Your Tokens</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {!isConnected ? (
              <p className="text-gray-500 text-sm border border-dashed border-[#2a2a2a] p-4 rounded text-center">Connect wallet to view your tokens.</p>
            ) : isLoading ? (
              <p className="text-gray-500 text-sm animate-pulse">Loading...</p>
            ) : myTokens.length === 0 ? (
              <p className="text-gray-500 text-sm border border-dashed border-[#2a2a2a] p-4 rounded text-center">You haven't launched or bought any tokens yet.</p>
            ) : (
              myTokens.map((token, index) => (
                <Link 
                  href={`/trade/${encodeURIComponent(token.address)}`} 
                  key={index} 
                  className="block bg-[#1a1a1a] border border-[#333] p-4 rounded-lg cursor-pointer hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-white">{token.name}</h3>
                    <span className="text-xs font-mono bg-[#333] px-2 py-1 rounded text-blue-400">${token.symbol}</span>
                  </div>
                  <p className="text-xs text-gray-500">Contract: <span className="text-gray-300 font-mono">{token.address.slice(0, 6)}...{token.address.slice(-4)}</span></p>
                  <p className="text-xs text-gray-500 mt-1">
                    Status: {token.isMatured ? <span className="text-yellow-500">Matured</span> : <span className="text-green-500">Initialised</span>}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

      </section>

      <div className="px-8 pb-8">
        <gecko-coin-compare-chart-widget locale="en" outlined="true" coin-ids="power-protocol,pudgy-penguins,bitcoin" initial-currency="usd" />
      </div> 
    </>
  );
}