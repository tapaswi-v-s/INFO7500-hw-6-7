"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { AmountInput } from "./AmountInput";
import { 
  getRouterContract,
  getPairContract,
  getCurrentAccount,
  getSigner,
  toWei,
  fromWei,
  showNotification
} from "../../utils/web3Utils";

interface Pool {
  address: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: ethers.BigNumber;
  reserve1: ethers.BigNumber;
}

export const RemoveLiquidity: React.FC = () => {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [lpBalance, setLpBalance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [lpAmount, setLpAmount] = useState("");
  const [token0Amount, setToken0Amount] = useState("");
  const [token1Amount, setToken1Amount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [slippage, setSlippage] = useState(0.5); // Default 0.5% slippage
  const [loadingApproval, setLoadingApproval] = useState(false);
  const [percentValue, setPercentValue] = useState(0);
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
        
        // Reset state when pool changes
        setLpAmount("");
        setToken0Amount("");
        setToken1Amount("");
        setIsApproved(false);
      } catch (error) {
        console.error("Error parsing pool data:", error);
      }
    }
  }, []);
  
  // Fetch LP token balance and approval
  useEffect(() => {
    const fetchLpBalanceAndApproval = async () => {
      if (!selectedPool || !account) {
        return;
      }
      
      try {
        const pairContract = getPairContract(selectedPool.address);
        const routerContract = getRouterContract();
        
        // Get LP token balance
        const balance = await pairContract.balanceOf(account);
        setLpBalance(balance);
        
        // Check if router is approved to spend LP tokens
        const allowance = await pairContract.allowance(account, routerContract.address);
        const lpAmountBigInt = lpAmount ? toWei(lpAmount) : ethers.BigNumber.from(0);
        
        setIsApproved(allowance.gte(lpAmountBigInt));
      } catch (error) {
        console.error("Error fetching LP balance:", error);
      }
    };
    
    fetchLpBalanceAndApproval();
  }, [selectedPool, account, lpAmount]);
  
  // Calculate token amounts based on LP amount
  useEffect(() => {
    const calculateTokenAmounts = async () => {
      if (
        !selectedPool || 
        !lpAmount || 
        parseFloat(lpAmount) === 0
      ) {
        setToken0Amount("");
        setToken1Amount("");
        return;
      }
      
      try {
        const pairContract = getPairContract(selectedPool.address);
        
        // Get total supply of LP tokens
        const totalSupply = await pairContract.totalSupply();
        
        // Get reserves
        const reserves = await pairContract.getReserves();
        
        // Calculate the share of reserves
        const lpAmountBigInt = toWei(lpAmount);
        const token0AmountBigInt = lpAmountBigInt.mul(reserves[0]).div(totalSupply);
        const token1AmountBigInt = lpAmountBigInt.mul(reserves[1]).div(totalSupply);
        
        setToken0Amount(fromWei(token0AmountBigInt));
        setToken1Amount(fromWei(token1AmountBigInt));
      } catch (error) {
        console.error("Error calculating token amounts:", error);
      }
    };
    
    calculateTokenAmounts();
  }, [selectedPool, lpAmount]);
  
  // Handle LP amount input change
  const handleLpAmountChange = (value: string) => {
    setLpAmount(value);
    
    // Update percentage slider
    if (value && !lpBalance.isZero()) {
      const lpAmountBigInt = toWei(value);
      const percentage = lpAmountBigInt.mul(100).div(lpBalance).toNumber();
      setPercentValue(percentage > 100 ? 100 : percentage);
    } else {
      setPercentValue(0);
    }
  };
  
  // Handle percentage slider change
  const handlePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseInt(e.target.value);
    setPercentValue(percent);
    
    if (!lpBalance.isZero()) {
      const newAmount = lpBalance.mul(percent).div(100);
      setLpAmount(fromWei(newAmount));
    }
  };
  
  // Handle max button click
  const handleMaxClick = () => {
    if (!lpBalance.isZero()) {
      setLpAmount(fromWei(lpBalance));
      setPercentValue(100);
    }
  };
  
  // Handle approve
  const handleApprove = async () => {
    if (!selectedPool || !lpAmount || !account) return;
    
    setLoadingApproval(true);
    
    try {
      const signer = await getSigner();
      const pairContract = getPairContract(selectedPool.address, signer);
      const routerContract = getRouterContract();
      
      // Approve a large amount for ease of use
      const tx = await pairContract.approve(routerContract.address, ethers.constants.MaxUint256);
      
      showNotification("success", `LP token approval submitted: ${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`);
      
      // Wait for confirmation
      await tx.wait();
      setIsApproved(true);
      showNotification("success", "LP tokens approved");
    } catch (error) {
      console.error("Error approving LP tokens:", error);
      showNotification("error", "Failed to approve LP tokens");
    } finally {
      setLoadingApproval(false);
    }
  };
  
  // Handle remove liquidity
  const handleRemoveLiquidity = async () => {
    if (
      !selectedPool || 
      !lpAmount || 
      !token0Amount || 
      !token1Amount || 
      !account
    ) return;
    
    setIsLoading(true);
    
    try {
      const signer = await getSigner();
      const routerContract = getRouterContract(signer);
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const lpAmountBigInt = toWei(lpAmount);
      
      // Calculate minimum amounts with slippage tolerance
      const token0AmountBigInt = toWei(token0Amount);
      const token1AmountBigInt = toWei(token1Amount);
      
      const slippageMultiplier = ethers.BigNumber.from(Math.floor((100 - slippage) * 100)).div(100);
      const token0Min = token0AmountBigInt.mul(slippageMultiplier).div(100);
      const token1Min = token1AmountBigInt.mul(slippageMultiplier).div(100);
      
      // Remove liquidity
      const tx = await routerContract.removeLiquidity(
        selectedPool.token0,
        selectedPool.token1,
        lpAmountBigInt,
        token0Min,
        token1Min,
        account,
        deadline
      );
      
      showNotification("success", `Liquidity removal submitted: ${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`);
      
      // Wait for confirmation
      await tx.wait();
      showNotification("success", "Liquidity removed successfully");
      
      // Reset form
      setLpAmount("");
      setToken0Amount("");
      setToken1Amount("");
      setPercentValue(0);
    } catch (error) {
      console.error("Error removing liquidity:", error);
      showNotification("error", "Failed to remove liquidity");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle slippage change
  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlippage(parseFloat(e.target.value));
  };
  
  // Navigate to pool selection
  const handleSelectPool = () => {
    router.push("/select-pool?action=redeem");
  };
  
  if (!account) {
    return (
      <div className="card bg-base-200 p-8 text-center">
        <h3 className="text-xl mb-2">Wallet Not Connected</h3>
        <p className="opacity-70 mb-4">
          Please connect your wallet to remove liquidity.
        </p>
      </div>
    );
  }
  
  if (!selectedPool) {
    return (
      <div className="card bg-base-200 p-8 text-center">
        <h3 className="text-xl mb-2">No Pool Selected</h3>
        <p className="opacity-70 mb-4">
          Please select a pool to remove liquidity from.
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">Remove Liquidity</h2>
          <div className="badge badge-primary p-3">
            {selectedPool.token0Symbol}/{selectedPool.token1Symbol}
          </div>
        </div>
        
        {/* LP balance information */}
        <div className="bg-base-300 p-4 rounded-box mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm opacity-70">Your LP Balance:</span>
            <span className="font-medium">{fromWei(lpBalance)}</span>
          </div>
          <div className="text-xs opacity-50 truncate">
            Pool Address: {selectedPool.address}
          </div>
        </div>
        
        {/* LP amount input */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span>LP Tokens to Remove</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={handleMaxClick}
              disabled={lpBalance.isZero()}
            >
              MAX
            </button>
          </div>
          <div className="bg-base-100 p-4 rounded-box mb-2">
            <AmountInput
              value={lpAmount}
              onChange={handleLpAmountChange}
              placeholder="0.0"
              disabled={lpBalance.isZero()}
            />
          </div>
          
          {/* Percentage slider */}
          <div className="form-control">
            <input
              type="range"
              min="0"
              max="100"
              value={percentValue}
              onChange={handlePercentChange}
              className="range range-xs range-primary"
              disabled={lpBalance.isZero()}
            />
            <div className="flex justify-between text-xs px-2 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
        
        {/* You will receive section */}
        <div className="bg-base-300 p-4 rounded-box mb-6">
          <div className="text-sm font-medium mb-3">You will receive:</div>
          
          <div className="flex justify-between mb-2">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                {selectedPool.token0Symbol.charAt(0)}
              </div>
              <span>{selectedPool.token0Symbol}</span>
            </div>
            <span className="font-medium">{token0Amount || "0"}</span>
          </div>
          
          <div className="flex justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                {selectedPool.token1Symbol.charAt(0)}
              </div>
              <span>{selectedPool.token1Symbol}</span>
            </div>
            <span className="font-medium">{token1Amount || "0"}</span>
          </div>
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
            disabled={
              !lpAmount || 
              parseFloat(lpAmount) === 0 || 
              toWei(lpAmount).gt(lpBalance) ||
              loadingApproval
            }
          >
            {loadingApproval ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Approving...
              </>
            ) : (
              "Approve LP Tokens"
            )}
          </button>
        ) : (
          <button
            className="btn btn-primary w-full"
            onClick={handleRemoveLiquidity}
            disabled={
              !lpAmount || 
              parseFloat(lpAmount) === 0 || 
              toWei(lpAmount).gt(lpBalance) ||
              isLoading
            }
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Removing Liquidity...
              </>
            ) : (
              "Remove Liquidity"
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