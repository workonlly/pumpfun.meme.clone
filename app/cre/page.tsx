'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import type { Abi } from 'viem';
import launchpadAbi from '../../contracts/out/Counter.sol/MemeCoinLaunchPad.json';
import { LAUNCHPAD_ADDRESS } from '../constant';

const abi = launchpadAbi.abi as Abi;

export default function Create() {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [totalSupply, setTotalSupply] = useState('1000000'); // Fixed capital 'S'

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  
  // Added the dependency array [isConfirmed] so it only triggers when the transaction succeeds
  useEffect(() => {
    if (isConfirmed) {
      setName('');
      setSymbol('');
      setTotalSupply('1000000');
    }
  }, [isConfirmed]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    writeContract({
      address: LAUNCHPAD_ADDRESS as `0x${string}`,
      abi: abi,
      functionName: 'createCoin',
      args: [name, symbol, BigInt(totalSupply)],
      value: parseEther('0.01'), // Sends the 0.01 ETH listing fee
    });
  };

  // Removed the extra "};" that was right here

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans text-white">
      <div className="max-w-md w-full bg-[#0a0a0a] rounded-2xl border border-neutral-800 p-8 shadow-2xl">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Your Meme Coin</h1>
          <p className="text-neutral-400 text-sm">
            Configure your token details below to deploy it to the blockchain. <br/>
            <span className="text-green-400 font-bold mt-1 inline-block">Fee: 0.01 ETH</span>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleLaunch}>
          {/* Logo Upload Placeholder (Visual only for now) */}
          <div className="flex flex-col items-center justify-center border border-dashed border-neutral-700 rounded-xl p-6 bg-black hover:bg-neutral-900 transition cursor-pointer">
            <div className="text-2xl mb-2 text-neutral-500">↑</div>
            <p className="text-sm font-medium text-neutral-300">Upload coin logo</p>
            <p className="text-xs text-neutral-500 mt-1">PNG, JPG, or GIF (max. 5MB)</p>
          </div>

          {/* Token Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Name
            </label>
            <input 
              type="text" 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Doge Clone"
              className="w-full bg-black border border-neutral-800 text-white rounded-lg px-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all" 
              required 
            />
          </div>

          {/* Token Symbol */}
          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Ticker Symbol
            </label>
            <input 
              type="text" 
              id="symbol" 
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. DOGE"
              className="w-full bg-black border border-neutral-800 text-white rounded-lg px-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all uppercase" 
              required 
            />
          </div>

          {/* Total Supply */}
          <div>
            <label htmlFor="totalSupply" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Total Supply
            </label>
            <input 
              type="number" 
              id="totalSupply" 
              value={totalSupply}
              onChange={(e) => setTotalSupply(e.target.value)}
              className="w-full bg-black border border-neutral-800 text-white rounded-lg px-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all" 
              required 
              min="1" 
            />
          </div>

          {/* Blockchain Error Display */}
          {error && (
            <div className="text-red-400 text-sm h-20 pl-2 bg-red-900/20 border border-red-500/30 rounded-lg break-words">
              {(error as any).shortMessage || error.message}
            </div>
          )}

          {/* Blockchain Success Display */}
          {isConfirmed && (
            <div className="text-green-400 text-sm p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-center font-bold">
              🎉 Token deployed to the blockchain!
            </div>
          )}

          {/* Dynamic Submit Button */}
          <button 
            type="submit" 
            disabled={isPending || isConfirming}
            className={`w-full py-3.5 px-4 font-bold rounded-lg transition-colors ${
              isPending || isConfirming 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {isPending ? 'Confirm in Wallet...' : 
             isConfirming ? 'Minting on sepolia...' : 
             'Create Token'}
          </button>
        </form>

      </div>
    </div>
  );
}