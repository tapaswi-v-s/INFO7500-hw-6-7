import { ethers } from "ethers";

// Contract ABIs
import WETH9ABI from "../abis/WETH9.json";
import ERC20ABI from "../abis/TestToken.json";
import FactoryABI from "../abis/UniswapV2Factory.json";
import RouterABI from "../abis/UniswapV2Router.json";
import PairABI from "../abis/UniswapV2Pair.json";

// Contract addresses - Replace with your deployed contract addresses
const contractAddresses = {
  weth: process.env.NEXT_PUBLIC_WETH_ADDRESS || "",
  testToken: process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS || "",
  testToken2: process.env.NEXT_PUBLIC_TEST_TOKEN2_ADDRESS || "",
  factory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "",
  router: process.env.NEXT_PUBLIC_ROUTER_ADDRESS || "",
};

// Get Web3 provider
export const getProvider = () => {
  // Check if window.ethereum is available
  if (window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  
  // Fallback to JSON-RPC provider (tenderly fork)
  const rpcUrl = process.env.NEXT_PUBLIC_TENDERLY_RPC_URL || "http://localhost:8545";
  return new ethers.providers.JsonRpcProvider(rpcUrl);
};

// Get signer
export const getSigner = async () => {
  const provider = getProvider();
  
  // If using MetaMask, request accounts to get signer
  if (window.ethereum) {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }
  
  return provider.getSigner();
};

// Get current account
export const getCurrentAccount = async (): Promise<string | null> => {
  if (!window.ethereum) return null;
  
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Error getting accounts:", error);
    return null;
  }
};

// Contract instances
export const getFactoryContract = (signerOrProvider?: ethers.providers.Provider | ethers.Signer) => {
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(contractAddresses.factory, FactoryABI['abi'], provider);
};

export const getRouterContract = (signerOrProvider?: ethers.providers.Provider | ethers.Signer) => {
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(contractAddresses.router, RouterABI['abi'], provider);
};

export const getWETHContract = (signerOrProvider?: ethers.providers.Provider | ethers.Signer) => {
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(contractAddresses.weth, WETH9ABI['abi'], provider);
};

export const getERC20Contract = (tokenAddress: string, signerOrProvider?: ethers.providers.Provider | ethers.Signer) => {
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(tokenAddress, ERC20ABI['abi'], provider);
};

export const getPairContract = (pairAddress: string, signerOrProvider?: ethers.providers.Provider | ethers.Signer) => {
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(pairAddress, PairABI, provider);
};

// Helper functions
export const toWei = (amount: string) => {
  return ethers.utils.parseUnits(amount, 18);
};

export const fromWei = (amount: ethers.BigNumberish) => {
  return ethers.utils.formatUnits(amount, 18);
};

// Handle transaction notifications
export const showNotification = (type: "success" | "error", message: string) => {
  // Basic implementation - replace with your UI notification system
  if (type === "success") {
    console.log(`✅ ${message}`);
    alert(`Success: ${message}`);
  } else {
    console.error(`❌ ${message}`);
    alert(`Error: ${message}`);
  }
};

// Ethereum listener setup
export const setupWeb3Listeners = (callback: () => void) => {
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", callback);
    window.ethereum.on("chainChanged", callback);
  }
  
  return () => {
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", callback);
      window.ethereum.removeListener("chainChanged", callback);
    }
  };
};