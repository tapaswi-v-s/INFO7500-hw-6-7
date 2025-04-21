"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { getCurrentAccount } from "~~/utils/web3Utils";
import { NaturalLanguageInput } from "~~/components/uniswap/NaturalLanguageInput";

// Simple Address component
const Address = ({ address }: { address: string | null }) => {
  if (!address) return <span className="text-sm">Not connected</span>;
  
  // Format address for display (0x1234...5678)
  const formattedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  
  return (
    <div className="bg-base-300 rounded-md px-3 py-1">
      <span className="font-mono text-sm">{formattedAddress}</span>
    </div>
  );
};

const Home: NextPage = () => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [availableTokens, setAvailableTokens] = useState([]);
  
  // Get connected address on component mount and when account changes
  useEffect(() => {
    const fetchAddress = async () => {
      const address = await getCurrentAccount();
      setConnectedAddress(address);
    };
    
    fetchAddress();
    
    // Set up event listener for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setConnectedAddress(accounts[0] || null);
      });
    }
    
    // Load available tokens from environment variables
    const tokens = [
      {
        address: process.env.NEXT_PUBLIC_WETH_ADDRESS || "",
        symbol: "WETH",
      }
    ];
    
    // Add test token if available
    if (process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS) {
      tokens.push({
        address: process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS,
        symbol: "TEST",
      });
    }
    
    // Add test token 2 if available
    if (process.env.NEXT_PUBLIC_TEST_TOKEN2_ADDRESS) {
      tokens.push({
        address: process.env.NEXT_PUBLIC_TEST_TOKEN2_ADDRESS,
        symbol: "TEST2", 
      });
    }
    
    setAvailableTokens(tokens);
    
    // Cleanup listener on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);
  
  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Uniswap V2 UI</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
        </div>
        
        {/* Natural Language Input */}
        <NaturalLanguageInput availableTokens={availableTokens} />
        
        <div className="flex-grow bg-base-300 w-full mt-8 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <h3 className="mt-2 text-xl font-semibold">Swap</h3>
              <p className="mt-2">
                Exchange one token for another from available pools.
              </p>
              <Link href="/swap" className="btn btn-primary btn-sm mt-4">
                Swap Tokens
              </Link>
            </div>
            
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <h3 className="mt-2 text-xl font-semibold">Deposit</h3>
              <p className="mt-2">
                Add liquidity to pools and earn fees on trades.
              </p>
              <Link href="/deposit" className="btn btn-primary btn-sm mt-4">
                Add Liquidity
              </Link>
            </div>
            
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
              </svg>
              <h3 className="mt-2 text-xl font-semibold">Redeem</h3>
              <p className="mt-2">
                Remove your liquidity from pools when you're ready.
              </p>
              <Link href="/redeem" className="btn btn-primary btn-sm mt-4">
                Remove Liquidity
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;