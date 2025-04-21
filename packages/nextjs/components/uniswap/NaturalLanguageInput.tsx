"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { processNaturalLanguageRequest } from "../../utils/nlpService";
import { 
  getCurrentAccount,
  getERC20Contract,
  getRouterContract,
  getSigner,
  toWei,
  showNotification
} from "../../utils/web3Utils";

interface Token {
  address: string;
  symbol: string;
}

interface NaturalLanguageInputProps {
  availableTokens: Token[];
}

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({ availableTokens }) => {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      // Get current account
      const account = await getCurrentAccount();
      if (!account) {
        throw new Error("Please connect your wallet first");
      }
      
      // Process the natural language input
      const processedRequest = await processNaturalLanguageRequest(input, availableTokens);
      
      // Log the processed request for debugging
      console.log("Processed request:", processedRequest);
      
      // Execute the appropriate operation based on the processed request
      switch (processedRequest.operation) {
        case "swap":
          await handleSwapOperation(processedRequest, account);
          break;
        case "deposit":
          await handleDepositOperation(processedRequest, account);
          break;
        case "redeem":
          await handleRedeemOperation(processedRequest, account);
          break;
        default:
          throw new Error("Unsupported operation");
      }
      
      // Set result message
      setResult(`Successfully processed: ${input}`);
      
      // Clear input
      setInput("");
      
    } catch (error) {
      console.error("Error processing natural language input:", error);
      setResult(`Error: ${error.message}`);
      showNotification("error", `Failed to process: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle swap operation
  const handleSwapOperation = async (processedRequest: any, account: string) => {
    if (processedRequest.tokens.length !== 2) {
      throw new Error("Swap requires exactly 2 tokens");
    }
    
    const inputToken = processedRequest.tokens[0];
    const outputToken = processedRequest.tokens[1];
    
    if (!inputToken.address || !outputToken.address) {
      throw new Error("Unknown token symbol in swap request");
    }
    
    if (!inputToken.amount) {
      throw new Error("Swap amount not specified");
    }
    
    // Store the swap parameters in localStorage
    localStorage.setItem("selectedPool", JSON.stringify({
      token0: inputToken.address,
      token1: outputToken.address,
      token0Symbol: inputToken.symbol,
      token1Symbol: outputToken.symbol,
    }));
    
    // Store the swap amount for the swap page
    localStorage.setItem("nlpSwapAmount", inputToken.amount.toString());
    
    // Navigate to swap page
    router.push("/swap");
    
    return `Will swap ${inputToken.amount} ${inputToken.symbol} for ${outputToken.symbol}`;
  };
  
  // Handle deposit operation
  const handleDepositOperation = async (processedRequest: any, account: string) => {
    if (processedRequest.tokens.length !== 2) {
      throw new Error("Deposit requires exactly 2 tokens");
    }
    
    const token0 = processedRequest.tokens[0];
    const token1 = processedRequest.tokens[1];
    
    if (!token0.address || !token1.address) {
      throw new Error("Unknown token symbol in deposit request");
    }
    
    if (!token0.amount || !token1.amount) {
      throw new Error("Deposit amounts not specified for both tokens");
    }
    
    // Store the deposit parameters in localStorage
    localStorage.setItem("selectedPool", JSON.stringify({
      token0: token0.address,
      token1: token1.address,
      token0Symbol: token0.symbol,
      token1Symbol: token1.symbol,
    }));
    
    // Store the deposit amounts for the deposit page
    localStorage.setItem("nlpDepositAmount0", token0.amount.toString());
    localStorage.setItem("nlpDepositAmount1", token1.amount.toString());
    
    // Navigate to deposit page
    router.push("/deposit");
    
    return `Will deposit ${token0.amount} ${token0.symbol} and ${token1.amount} ${token1.symbol}`;
  };
  
  // Handle redeem operation
  const handleRedeemOperation = async (processedRequest: any, account: string) => {
    if (processedRequest.tokens.length !== 2) {
      throw new Error("Redeem requires a token pair (2 tokens)");
    }
    
    const token0 = processedRequest.tokens[0];
    const token1 = processedRequest.tokens[1];
    
    if (!token0.address || !token1.address) {
      throw new Error("Unknown token symbol in redeem request");
    }
    
    // Store the redeem parameters in localStorage
    localStorage.setItem("selectedPool", JSON.stringify({
      token0: token0.address,
      token1: token1.address,
      token0Symbol: token0.symbol,
      token1Symbol: token1.symbol,
    }));
    
    // Store any percentage information if provided
    if (token0.amount) {
      localStorage.setItem("nlpRedeemPercentage", (token0.amount * 100).toString());
    }
    
    // Navigate to redeem page
    router.push("/redeem");
    
    return `Will redeem from ${token0.symbol}-${token1.symbol} pool`;
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-4 mb-8 px-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            Natural Language Commands
          </h2>
          
          <p className="text-sm opacity-70 mb-4">
            Try commands like "swap 10 WETH for TEST" or "deposit 5 WETH and 10 TEST"
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your command..."
                className="input input-bordered flex-grow"
                disabled={isProcessing}
              />
              <button
                type="submit"
                className={`btn btn-primary ml-2 ${isProcessing ? 'loading' : ''}`}
                disabled={isProcessing || !input.trim()}
              >
                {isProcessing ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Processing...
                  </>
                ) : (
                  "Execute"
                )}
              </button>
            </div>
            
            {result && (
              <div className={`alert ${result.startsWith("Error") ? "alert-error" : "alert-success"} mt-4`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  {result.startsWith("Error") ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <span>{result}</span>
              </div>
            )}
          </form>
          
          <div className="divider mt-4">Example Commands</div>
          
          <div className="text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-base-200 rounded-lg p-2">
                <span className="font-medium">Swap:</span> swap 10 WETH for TEST
              </div>
              <div className="bg-base-200 rounded-lg p-2">
                <span className="font-medium">Deposit:</span> deposit 5 WETH and 20 TEST
              </div>
              <div className="bg-base-200 rounded-lg p-2">
                <span className="font-medium">Redeem:</span> remove liquidity from WETH-TEST pool
              </div>
              <div className="bg-base-200 rounded-lg p-2">
                <span className="font-medium">Percentage:</span> redeem 50% of WETH-TEST position
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};