'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Abi } from 'viem';
import launchpadArtifact from '../../../contracts/out/Counter.sol/MemeCoinLaunchPad.json';
import { LAUNCHPAD_ADDRESS } from '../../constant';

const launchpadAbi = launchpadArtifact.abi as Abi;

export default function TradePage() {
  // Grab the dynamic token address from the URL
  const params = useParams();
  const rawAddress = Array.isArray(params.address) ? params.address[0] : params.address;
  const decodedAddress = typeof rawAddress === 'string' ? decodeURIComponent(rawAddress) : '';
  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(decodedAddress);
  const coinAddress = decodedAddress as `0x${string}`;

  const [buyAmount, setBuyAmount] = useState('10');

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      setBuyAmount('10'); // Reset after successful buy
    }
  }, [isConfirmed]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAddress) return;
    
    writeContract({
      address: LAUNCHPAD_ADDRESS as `0x${string}`,
      abi: launchpadAbi,
      functionName: 'buyTokens',
      // We pass the specific coin address and the amount of WHOLE tokens to buy
      args: [coinAddress, BigInt(buyAmount)],
      // Send 1 ETH as a buffer. The smart contract will refund the difference!
      value: parseEther('1'), 
    });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans text-white">
      <div className="max-w-md w-full bg-[#0a0a0a] rounded-2xl border border-neutral-800 p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Trade Token</h1>
          <p className="text-neutral-400 text-sm font-mono break-all bg-black p-2 rounded-lg border border-neutral-800 mt-4">
            {isValidAddress ? coinAddress : 'Invalid token address'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleBuy}>
          <div>
            <label htmlFor="buyAmount" className="block text-sm font-medium text-neutral-300 mb-1.5">
              How many tokens do you want to buy?
            </label>
            <input 
              type="number" 
              id="buyAmount" 
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="w-full bg-black border border-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-all text-xl font-bold" 
              required 
              min="1" 
              max="1000" // Our maturity target is 1000!
            />
          </div>

          {/* Warning about the buffer */}
          <div className="text-xs text-neutral-500 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
            💡 <strong className="text-neutral-300">Bonding Curve Active:</strong> To ensure your transaction doesn't fail due to price slippage, we will request 1 ETH from your wallet and instantly refund the unspent amount.
          </div>

          {error && (
            <div className="text-red-400 text-sm p-3 bg-red-900/20 border border-red-500/30 rounded-lg break-words">
              {(error as any).shortMessage || error.message}
            </div>
          )}

          {isConfirmed && (
            <div className="text-green-400 text-sm p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-center font-bold">
              🎉 Purchase successful! You are now an early adopter.
            </div>
          )}

          <button 
            type="submit" 
            disabled={!isValidAddress || isPending || isConfirming}
            className={`w-full py-3.5 px-4 font-bold rounded-lg transition-colors ${
              !isValidAddress || isPending || isConfirming 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700' 
                : 'bg-green-500 text-black hover:bg-green-400'
            }`}
          >
            {!isValidAddress ? 'Invalid Address' :
             isPending ? 'Confirm in Wallet...' : 
             isConfirming ? 'Buying Tokens...' : 
             `Buy ${buyAmount} Tokens`}
          </button>
        </form>

      </div>
    </div>
  );
}