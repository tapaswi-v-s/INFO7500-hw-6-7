"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { 
  getFactoryContract, 
  getPairContract, 
  getERC20Contract, 
  getCurrentAccount,
  fromWei,
  showNotification
} from "../../utils/web3Utils";

// Define interfaces for type safety
interface Pool {
  address: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: ethers.BigNumber;
  reserve1: ethers.BigNumber;
  pairName: string;
}

interface PoolSelectorProps {
  onPoolSelect: (pool: Pool) => void;
}

export const PoolSelector: React.FC<PoolSelectorProps> = ({ onPoolSelect }) => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<string | null>(null);
  
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
  
  // Fetch all available pools
  useEffect(() => {
    const fetchPools = async () => {
      if (!account) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        const factoryContract = getFactoryContract();
        
        // Get the number of pairs from factory
        const pairCount = await factoryContract.allPairsLength();
        
        const poolPromises = [];
        
        for (let i = 0; i < pairCount.toNumber(); i++) {
          poolPromises.push(fetchPoolData(i));
        }
        
        const poolsData = await Promise.all(poolPromises);
        setPools(poolsData.filter(Boolean) as Pool[]);
      } catch (error) {
        console.error("Error fetching pools:", error);
        showNotification("error", "Failed to load pools");
      } finally {
        setLoading(false);
      }
    };
    
    // Function to fetch data for a specific pool
    const fetchPoolData = async (index: number): Promise<Pool | null> => {
      try {
        const factoryContract = getFactoryContract();
        
        // Get pair address
        const pairAddress = await factoryContract.allPairs(index);
        
        // Get pair contract
        const pairContract = getPairContract(pairAddress);
        
        // Get token addresses
        const token0 = await pairContract.token0();
        const token1 = await pairContract.token1();
        
        // Get token contracts
        const token0Contract = getERC20Contract(token0);
        const token1Contract = getERC20Contract(token1);
        
        // Get token symbols
        const token0Symbol = await token0Contract.symbol();
        const token1Symbol = await token1Contract.symbol();
        
        // Get reserves
        const reserves = await pairContract.getReserves();
        
        return {
          address: pairAddress,
          token0,
          token1,
          token0Symbol,
          token1Symbol,
          reserve0: reserves[0],
          reserve1: reserves[1],
          pairName: `${token0Symbol}/${token1Symbol}`
        };
      } catch (error) {
        console.error(`Error fetching data for pair index ${index}:`, error);
        return null;
      }
    };
    
    if (account) {
      fetchPools();
    }
  }, [account]);
  
  return (
    <div className="w-full">
      {!account ? (
        <div className="card bg-base-200 p-6 text-center">
          <h3 className="text-xl mb-2">Wallet Not Connected</h3>
          <p className="opacity-70">
            Please connect your wallet to view available pools.
          </p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : pools.length === 0 ? (
        <div className="card bg-base-200 p-6 text-center">
          <h3 className="text-xl mb-2">No Pools Found</h3>
          <p className="opacity-70">
            You need to create a pool first by adding liquidity for a token pair.
          </p>
          <button 
            className="btn btn-primary mt-4"
            onClick={() => window.location.href = "/deposit"}
          >
            Create a Pool
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {pools.map((pool) => (
            <div 
              key={pool.address}
              className="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
              onClick={() => onPoolSelect(pool)}
            >
              <div className="card-body p-4">
                <h3 className="card-title text-lg">{pool.pairName}</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-base-100 rounded p-2">
                    <div className="text-xs opacity-70">Reserve</div>
                    <div className="font-medium">
                      {fromWei(pool.reserve0)} {pool.token0Symbol}
                    </div>
                  </div>
                  <div className="bg-base-100 rounded p-2">
                    <div className="text-xs opacity-70">Reserve</div>
                    <div className="font-medium">
                      {fromWei(pool.reserve1)} {pool.token1Symbol}
                    </div>
                  </div>
                </div>
                <div className="text-xs opacity-50 mt-2 truncate">
                  {pool.address}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};