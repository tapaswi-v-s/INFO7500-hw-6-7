"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { AmountInput } from "./AmountInput";
import { 
  getRouterContract,
  getERC20Contract,
  getCurrentAccount,
  getSigner,
  toWei,
  fromWei,
  showNotification
} from "../../utils/web3Utils";

interface Token {
  address: string;
  symbol: string;
}

interface Pool {
  address: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: ethers.BigNumber;
  reserve1: ethers.BigNumber;
}

interface SwapFormProps {
  nlpEnabled?: boolean;
}

export const SwapForm: React.FC<SwapFormProps> = ({ nlpEnabled = false }) => {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isLoadingApproval, setIsLoadingApproval] = useState(false);
  const [isLoadingSwap, setIsLoadingSwap] = useState(false);
  const [slippage, setSlippage] = useState(0.5); // Default 0.5% slippage
  const [account, setAccount] = useState<string | null>(null);
  
  const router = useRouter();
  
  // Check for wallet connection
  useEffect(() => {
    const checkAccount = async () => {
      const currentAccount = await getCurrentAccount();
      setAccount(currentAccount);
    };
    
    checkAccount();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts.length > 0 ? accounts[0] : null);
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);
  
  // Load selected pool from localStorage
  useEffect(() => {
    const poolData = localStorage.getItem("selectedPool");
    if (poolData) {
      try {
        const pool = JSON.parse(poolData);
        setSelectedPool(pool);
        setInputToken({
          address: pool.token0,
          symbol: pool.token0Symbol,
        });
        setOutputToken({
          address: pool.token1,
          symbol: pool.token1Symbol,
        });
        
        // Check for NLP input if enabled
        if (nlpEnabled && window.nlpSwapAmount) {
          setInputAmount(window.nlpSwapAmount);
          // Clear it to avoid reusing
          delete window.nlpSwapAmount;
        }
      } catch (error) {
        console.error("Error parsing pool data:", error);
      }
    }
  }, [nlpEnabled]);
  
  // Check token approval
  useEffect(() => {
    const checkApproval = async () => {
      if (!inputToken || !account || !inputAmount || parseFloat(inputAmount) === 0) {
        return;
      }
      
      try {
        const erc20Contract = getERC20Contract(inputToken.address);
        const routerContract = getRouterContract();
        
        const allowance = await erc20Contract.allowance(account, routerContract.address);
        const inputAmountWei = toWei(inputAmount);
        
        setIsApproved(allowance.gte(inputAmountWei));
      } catch (error) {
        console.error("Error checking approval:", error);
        setIsApproved(false);
      }
    };
    
    checkApproval();
  }, [inputToken, account, inputAmount]);
  
  // Calculate output amount when input amount changes
  useEffect(() => {
    const calculateOutputAmount = async () => {
      if (!inputToken || !outputToken || !inputAmount || parseFloat(inputAmount) === 0) {
        setOutputAmount("");
        return;
      }
      
      try {
        const routerContract = getRouterContract();
        const amountWei = toWei(inputAmount);
        
        const amounts = await routerContract.getAmountsOut(
          amountWei,
          [inputToken.address, outputToken.address]
        );
        
        setOutputAmount(fromWei(amounts[1]));
      } catch (error) {
        console.error("Error calculating output amount:", error);
        setOutputAmount("");
      }
    };
    
    calculateOutputAmount();
  }, [inputToken, outputToken, inputAmount]);
  
  // Handle input amount change
  const handleInputChange = (value: string) => {
    setInputAmount(value);
  };
  
  // Switch tokens
  const handleSwitchTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount("");
    setOutputAmount("");
  };
  
  // Navigate to pool selection
  const handleSelectPool = () => {
    router.push("/select-pool?action=swap");
  };
  
  // Approve token spending
  const handleApprove = async () => {
    if (!inputToken || !inputAmount || !account) return;
    
    setIsLoadingApproval(true);
    
    try {
      const signer = await getSigner();
      const erc20Contract = getERC20Contract(inputToken.address, signer);
      const routerContract = getRouterContract();
      
      // Approve a large amount for ease of use
      const amountToApprove = ethers.constants.MaxUint256;
      
      const tx = await erc20Contract.approve(routerContract.address, amountToApprove);
      showNotification("success", `Approval submitted: ${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`);
      
      // Wait for transaction confirmation
      await tx.wait();
      setIsApproved(true);
      showNotification("success", "Approval confirmed");
    } catch (error) {
      console.error("Error approving tokens:", error);
      showNotification("error", "Failed to approve tokens");
    } finally {
      setIsLoadingApproval(false);
    }
  };
  
  // Execute the swap
  const handleSwap = async () => {
    if (!inputToken || !outputToken || !inputAmount || !outputAmount || !account) return;
    
    setIsLoadingSwap(true);
    
    try {
      const signer = await getSigner();
      const routerContract = getRouterContract(signer);
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const amountIn = toWei(inputAmount);
      
      // Apply slippage tolerance to the output amount
      const outputAmountBN = toWei(outputAmount);
      const minAmountOut = outputAmountBN.mul(100 - Math.floor(slippage * 100)).div(100);
      
      const tx = await routerContract.swapExactTokensForTokens(
        amountIn,
        minAmountOut,
        [inputToken.address, outputToken.address],
        account,
        deadline
      );
      
      showNotification("success", `Swap submitted: ${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`);
      
      // Wait for transaction confirmation
      await tx.wait();
      showNotification("success", "Swap confirmed");
      
      // Reset form
      setInputAmount("");
      setOutputAmount("");
    } catch (error) {
      console.error("Error performing swap:", error);
      showNotification("error", "Failed to swap tokens");
    } finally {
      setIsLoadingSwap(false);
    }
  };
  
  // Handle slippage change
  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlippage(parseFloat(e.target.value));
  };
  
  if (!account) {
    return (
      <div className="card bg-base-200 p-8 text-center">
        <h3 className="text-xl mb-2">Wallet Not Connected</h3>
        <p className="opacity-70 mb-4">
          Please connect your wallet to swap tokens.
        </p>
      </div>
    );
  }
  
  if (!selectedPool) {
    return (
      <div className="card bg-base-200 p-8 text-center">
        <h3 className="text-xl mb-2">No Pool Selected</h3>
        <p className="opacity-70 mb-4">
          Please select a pool to perform swaps.
        </p>
        <button
          onClick={handleSelectPool}
          className="btn btn-primary"
        >
          Select Pool
        </button>
      </div>
    );
  }
  
  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <div className="mb-2 flex justify-between items-center">
          <span className="font-medium">From</span>
          <span className="text-sm opacity-70">
            Pool: {selectedPool.token0Symbol}/{selectedPool.token1Symbol}
          </span>
        </div>
        
        {/* Input token section */}
        <div className="bg-base-100 p-4 rounded-box mb-2">
          <div className="flex justify-between mb-2">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                {inputToken?.symbol.charAt(0)}
              </div>
              <span className="font-medium">{inputToken?.symbol}</span>
            </div>
          </div>
          <AmountInput
            value={inputAmount}
            onChange={handleInputChange}
            placeholder="0.0"
          />
        </div>
        
        {/* Swap direction button */}
        <div className="flex justify-center -my-2 z-10">
          <button
            className="btn btn-circle btn-sm bg-base-300"
            onClick={handleSwitchTokens}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down-up">
              <path d="m3 16 4 4 4-4"></path>
              <path d="M7 20V4"></path>
              <path d="m21 8-4-4-4 4"></path>
              <path d="M17 4v16"></path>
            </svg>
          </button>
        </div>
        
        {/* Output token section */}
        <div className="bg-base-100 p-4 rounded-box mb-4">
          <div className="flex justify-between mb-2">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                {outputToken?.symbol.charAt(0)}
              </div>
              <span className="font-medium">{outputToken?.symbol}</span>
            </div>
          </div>
          <AmountInput
            value={outputAmount}
            onChange={() => {}}
            placeholder="0.0"
            disabled={true}
          />
        </div>
        
        {/* Slippage settings */}
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Slippage Tolerance</span>
            <span className="label-text-alt">{slippage}%</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={slippage}
            onChange={handleSlippageChange}
            className="range range-xs range-primary"
          />
          <div className="flex justify-between text-xs px-2 mt-1">
            <span>0.1%</span>
            <span>5%</span>
          </div>
        </div>
        
        {/* Action buttons */}
        {!isApproved ? (
          <button
            className="btn btn-primary w-full"
            onClick={handleApprove}
            disabled={!inputAmount || parseFloat(inputAmount) === 0 || isLoadingApproval}
          >
            {isLoadingApproval ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Approving...
              </>
            ) : (
              `Approve ${inputToken?.symbol}`
            )}
          </button>
        ) : (
          <button
            className="btn btn-primary w-full"
            onClick={handleSwap}
            disabled={
              !inputAmount || 
              !outputAmount || 
              parseFloat(inputAmount) === 0 || 
              parseFloat(outputAmount) === 0 || 
              isLoadingSwap
            }
          >
            {isLoadingSwap ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Swapping...
              </>
            ) : (
              "Swap"
            )}
          </button>
        )}
        
        {/* Pool selection link */}
        <div className="text-center mt-4">
          <button
            className="btn btn-sm btn-ghost"
            onClick={handleSelectPool}
          >
            Change Pool
          </button>
        </div>
      </div>
    </div>
  );
};