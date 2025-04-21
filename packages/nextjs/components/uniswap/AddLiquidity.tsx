"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { AmountInput } from "./AmountInput";
import { TokenSelector } from "./TokenSelector";
import { 
  getFactoryContract,
  getRouterContract,
  getERC20Contract,
  getWETHContract,
  getCurrentAccount,
  getSigner,
  toWei,
  fromWei,
  showNotification
} from "../../utils/web3Utils";

interface Token {
  address: string;
  symbol: string;
  balance?: string;
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

export const AddLiquidity: React.FC = () => {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [token0, setToken0] = useState<Token | null>(null);
  const [token1, setToken1] = useState<Token | null>(null);
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [token0Approved, setToken0Approved] = useState(false);
  const [token1Approved, setToken1Approved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [slippage, setSlippage] = useState(0.5); // Default 0.5% slippage
  const [loadingApproval0, setLoadingApproval0] = useState(false);
  const [loadingApproval1, setLoadingApproval1] = useState(false);
  const [existingPool, setExistingPool] = useState(false);
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
  
  // Load available tokens
  useEffect(() => {
    const loadTokens = async () => {
      if (!account) return;
      
      try {
        const availableTokens: Token[] = [];
        
        // Add WETH
        const wethContract = getWETHContract();
        const wethSymbol = await wethContract.symbol();
        const wethAddress = wethContract.address;
        
        availableTokens.push({
          address: wethAddress,
          symbol: wethSymbol,
        });
        
        // Add test tokens from environment variables
        const testTokenAddresses = [
          process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS,
          process.env.NEXT_PUBLIC_TEST_TOKEN2_ADDRESS
        ];
        
        for (const address of testTokenAddresses) {
          if (address && address !== "0x0000000000000000000000000000000000000000") {
            try {
              const tokenContract = getERC20Contract(address);
              const symbol = await tokenContract.symbol();
              
              availableTokens.push({
                address,
                symbol,
              });
            } catch (err) {
              console.error(`Error loading token at ${address}:`, err);
            }
          }
        }
        
        setTokens(availableTokens);
      } catch (error) {
        console.error("Error loading tokens:", error);
        showNotification("error", "Failed to load tokens");
      }
    };
    
    loadTokens();
  }, [account]);
  
  // Load selected pool from localStorage
  useEffect(() => {
    const poolData = localStorage.getItem("selectedPool");
    if (poolData) {
      try {
        const pool = JSON.parse(poolData);
        setSelectedPool(pool);
        setToken0({
          address: pool.token0,
          symbol: pool.token0Symbol,
        });
        setToken1({
          address: pool.token1,
          symbol: pool.token1Symbol,
        });
        
        // Check if this is an existing pool
        checkExistingPool(pool.token0, pool.token1);
      } catch (error) {
        console.error("Error parsing pool data:", error);
      }
    }
  }, []);
  
  // Check if token pair already exists
  const checkExistingPool = async (tokenA: string, tokenB: string) => {
    try {
      const factoryContract = getFactoryContract();
      const pairAddress = await factoryContract.getPair(tokenA, tokenB);
      setExistingPool(pairAddress !== ethers.constants.AddressZero);
    } catch (error) {
      console.error("Error checking existing pool:", error);
      setExistingPool(false);
    }
  };
  
  // Update token approvals
  useEffect(() => {
    const checkApprovals = async () => {
      if (!token0 || !token1 || !account || !amount0 || !amount1) {
        return;
      }
      
      try {
        const routerContract = getRouterContract();
        
        // Check token0 approval
        const token0Contract = getERC20Contract(token0.address);
        const allowance0 = await token0Contract.allowance(account, routerContract.address);
        const amount0Wei = toWei(amount0);
        setToken0Approved(allowance0.gte(amount0Wei));
        
        // Check token1 approval
        const token1Contract = getERC20Contract(token1.address);
        const allowance1 = await token1Contract.allowance(account, routerContract.address);
        const amount1Wei = toWei(amount1);
        setToken1Approved(allowance1.gte(amount1Wei));
      } catch (error) {
        console.error("Error checking approvals:", error);
      }
    };
    
    checkApprovals();
  }, [token0, token1, account, amount0, amount1]);
  
  // Calculate the corresponding amount when one amount changes
  useEffect(() => {
    const calculatePair = async () => {
      if (
        !token0 || 
        !token1 || 
        !amount0 ||
        parseFloat(amount0) === 0 ||
        !existingPool
      ) {
        return;
      }
      
      try {
        const factoryContract = getFactoryContract();
        const pairAddress = await factoryContract.getPair(token0.address, token1.address);
        
        if (pairAddress === ethers.constants.AddressZero) {
          return; // No existing pool
        }
        
        // Get pair contract
        const pairContract = getPairContract(pairAddress);
        
        // Get reserves
        const reserves = await pairContract.getReserves();
        const token0Address = await pairContract.token0();
        
        // Determine which reserve is which token
        let reserve0, reserve1;
        if (token0Address.toLowerCase() === token0.address.toLowerCase()) {
          [reserve0, reserve1] = [reserves[0], reserves[1]];
        } else {
          [reserve0, reserve1] = [reserves[1], reserves[0]];
        }
        
        // Calculate amount1 based on amount0 and reserve ratio
        const amount0Wei = toWei(amount0);
        const amount1Wei = amount0Wei.mul(reserve1).div(reserve0);
        
        setAmount1(fromWei(amount1Wei));
      } catch (error) {
        console.error("Error calculating pair amounts:", error);
      }
    };
    
    calculatePair();
  }, [token0, token1, amount0, existingPool]);
  
  // Handle token selection
  const handleToken0Select = (token: Token) => {
    if (token1 && token.address === token1.address) {
      // Swap tokens if selecting the same token
      setToken1(token0);
    }
    setToken0(token);
    setAmount0("");
    setAmount1("");
    
    if (token1) {
      checkExistingPool(token.address, token1.address);
    }
  };
  
  const handleToken1Select = (token: Token) => {
    if (token0 && token.address === token0.address) {
      // Swap tokens if selecting the same token
      setToken0(token1);
    }
    setToken1(token);
    setAmount0("");
    setAmount1("");
    
    if (token0) {
      checkExistingPool(token0.address, token.address);
    }
  };
  
  // Handle amount changes
  const handleAmount0Change = (value: string) => {
    setAmount0(value);
  };
  
  const handleAmount1Change = (value: string) => {
    setAmount1(value);
  };
  
  // Handle token approvals
  const handleApproveToken0 = async () => {
    if (!token0 || !amount0) return;
    
    setLoadingApproval0(true);
    
    try {
      const signer = await getSigner();
      const token0Contract = getERC20Contract(token0.address, signer);
      const routerContract = getRouterContract();
      
      // Approve a large amount for ease of use
      const tx = await token0Contract.approve(routerContract.address, ethers.constants.MaxUint256);
      
      showNotification("success", `${token0.symbol} approval submitted: ${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`);
      
      // Wait for confirmation
      await tx.wait();
      setToken0Approved(true);
      showNotification("success", `${token0.symbol} approved`);
    } catch (error) {
      console.error(`Error approving ${token0.symbol}:`, error);
      showNotification("error", `Failed to approve ${token0.symbol}`);
    } finally {
      setLoadingApproval0(false);
    }
  };
  
  const handleApproveToken1 = async () => {
    if (!token1 || !amount1) return;
    
    setLoadingApproval1(true);
    
    try {
      const signer = await getSigner();
      const token1Contract = getERC20Contract(token1.address, signer);
      const routerContract = getRouterContract();
      
      // Approve a large amount for ease of use
      const tx = await token1Contract.approve(routerContract.address, ethers.constants.MaxUint256);
      
      showNotification("success", `${token1.symbol} approval submitted: ${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`);
      
      // Wait for confirmation
      await tx.wait();
      setToken1Approved(true);
      showNotification("success", `${token1.symbol} approved`);
    } catch (error) {
      console.error(`Error approving ${token1.symbol}:`, error);
      showNotification("error", `Failed to approve ${token1.symbol}`);
    } finally {
      setLoadingApproval1(false);
    }
  };
  
  // Add liquidity
  const handleAddLiquidity = async () => {
    if (
      !token0 || 
      !token1 || 
      !amount0 || 
      !amount1 || 
      !account ||
      parseFloat(amount0) === 0 ||
      parseFloat(amount1) === 0
    ) return;
    
    setIsLoading(true);
    
    try {
      const signer = await getSigner();
      const routerContract = getRouterContract(signer);
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      // const amount0Wei = toWei(amount0);
      // const amount1Wei = toWei(amount1);

      // Use smaller amounts for testing
      const amount0Wei = toWei("0.001"); // Try with a very small amount first
      const amount1Wei = toWei("0.001"); // Try with a very small amount first
      
      // Calculate minimum amounts with slippage tolerance
      const slippageMultiplier = ethers.BigNumber.from(Math.floor((100 - slippage) * 100)).div(100);
      const amount0Min = amount0Wei.mul(slippageMultiplier).div(100);
      const amount1Min = amount1Wei.mul(slippageMultiplier).div(100);
      
      // Check token balances
      const token0Contract = getERC20Contract(token0.address);
      const token1Contract = getERC20Contract(token1.address);

      const balance0 = await token0Contract.balanceOf(account);
      const balance1 = await token1Contract.balanceOf(account);

      console.log(`Your ${token0.symbol} balance: ${fromWei(balance0)}`);
      console.log(`Your ${token1.symbol} balance: ${fromWei(balance1)}`);
      console.log(`Attempting to add: ${amount0} ${token0.symbol} and ${amount1} ${token1.symbol}`);

      // Verify you have enough tokens
      if (toWei(amount0).gt(balance0) || toWei(amount1).gt(balance1)) {
        showNotification("error", "Insufficient token balance");
        setIsLoading(false);
        return;
      }

      // Add liquidity
      const tx = await routerContract.addLiquidity(
        token0.address,
        token1.address,
        amount0Wei,
        amount1Wei,
        amount0Min,
        amount1Min,
        account,
        deadline,
        { gasLimit: 500000 }
      );
      
      showNotification("success", `Liquidity addition submitted: ${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`);
      
      // Wait for confirmation
      await tx.wait();
      showNotification("success", "Liquidity added successfully");
      
      // Reset form
      setAmount0("");
      setAmount1("");
    } catch (error) {
      console.error("Error adding liquidity:", error);
      showNotification("error", "Failed to add liquidity");
    } finally {
      setIsLoading(false);
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
          Please connect your wallet to add liquidity.
        </p>
      </div>
    );
  }
  
  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title mb-4">Add Liquidity</h2>
        
        {/* First token input */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span>Token 1</span>
          </div>
          <div className="flex flex-col gap-2">
            <TokenSelector
              tokens={tokens}
              selectedToken={token0}
              onSelectToken={handleToken0Select}
              label="Select Token"
            />
            <div className="bg-base-100 p-4 rounded-box">
              <AmountInput
                value={amount0}
                onChange={handleAmount0Change}
                placeholder="0.0"
                disabled={!token0}
              />
            </div>
            {token0 && amount0 && !token0Approved && (
              <button
                className="btn btn-sm btn-primary"
                onClick={handleApproveToken0}
                disabled={loadingApproval0}
              >
                {loadingApproval0 ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Approving...
                  </>
                ) : (
                  `Approve ${token0.symbol}`
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Second token input */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span>Token 2</span>
          </div>
          <div className="flex flex-col gap-2">
            <TokenSelector
              tokens={tokens}
              selectedToken={token1}
              onSelectToken={handleToken1Select}
              label="Select Token"
            />
            <div className="bg-base-100 p-4 rounded-box">
              <AmountInput
                value={amount1}
                onChange={handleAmount1Change}
                placeholder="0.0"
                disabled={!token1 || (existingPool && !!amount0)}
              />
            </div>
            {token1 && amount1 && !token1Approved && (
              <button
                className="btn btn-sm btn-primary"
                onClick={handleApproveToken1}
                disabled={loadingApproval1}
              >
                {loadingApproval1 ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Approving...
                  </>
                ) : (
                  `Approve ${token1.symbol}`
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Pool information */}
        {existingPool && (
          <div className="bg-base-300 p-4 rounded-box mb-4">
            <h3 className="font-medium mb-2">Pool Information</h3>
            <p className="text-sm">
              You are adding liquidity to an existing pool. The ratio of tokens added will be determined by the current pool ratio.
            </p>
          </div>
        )}
        
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
        
        {/* Action button */}
        <button
          className="btn btn-primary w-full"
          disabled={
            !token0 ||
            !token1 ||
            !amount0 ||
            !amount1 ||
            parseFloat(amount0) === 0 ||
            parseFloat(amount1) === 0 ||
            !token0Approved ||
            !token1Approved ||
            isLoading
          }
          onClick={handleAddLiquidity}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Adding Liquidity...
            </>
          ) : (
            "Add Liquidity"
          )}
        </button>
        
        {/* Pool selection */}
        {!selectedPool && (
          <div className="text-center mt-4">
            <p className="text-sm opacity-70 mb-2">
              Or select an existing pool
            </p>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => router.push("/select-pool?action=deposit")}
            >
              Select Pool
            </button>
          </div>
        )}
      </div>
    </div>
  );
};