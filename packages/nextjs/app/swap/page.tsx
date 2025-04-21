"use client"
import type { NextPage } from "next";
import { useEffect } from "react";
import { MetaHeader } from "~~/components/MetaHeader";
import { SwapForm } from "~~/components/uniswap/SwapForm";
import { Header } from "~~/components//uniswap/Header";
import { NaturalLanguageInput } from "../../components/uniswap/NaturalLanguageInput";


export default function SwapPage() {
  // Load available tokens for NLP
  const availableTokens = [
    {
      address: process.env.NEXT_PUBLIC_WETH_ADDRESS || "",
      symbol: "WETH",
    }
  ];
  
  // Add test token if available
  if (process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS) {
    availableTokens.push({
      address: process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS || "",
      symbol: "TEST",
    });
  }
  
  // Add test token 2 if available
  if (process.env.NEXT_PUBLIC_TEST_TOKEN2_ADDRESS) {
    availableTokens.push({
      address: process.env.NEXT_PUBLIC_TEST_TOKEN2_ADDRESS || "",
      symbol: "TEST2", 
    });
  }
  
  // Check for and handle NLP input from localStorage
  useEffect(() => {
    const nlpSwapAmount = localStorage.getItem("nlpSwapAmount");
    if (nlpSwapAmount) {
      // Set the amount in a global variable that SwapForm can access
      window.nlpSwapAmount = nlpSwapAmount;
      // Clear it from localStorage to avoid reusing
      localStorage.removeItem("nlpSwapAmount");
    }
  }, []);
  
  return (
    <>
      <MetaHeader title="Swap | Uniswap V2 UI" description="Swap tokens on Uniswap V2" />
      {/* <Header /> */}
      <div className="flex items-center flex-col flex-grow pt-10">
        <NaturalLanguageInput availableTokens={availableTokens} />
        
        <div className="px-5 w-full max-w-lg">
          <h1 className="text-center mb-8">
            <span className="block text-3xl font-bold">Swap Tokens</span>
          </h1>
          <SwapForm nlpEnabled={true} />
        </div>
      </div>
    </>
  );
}