"use client";
import React, { useState, useEffect } from "react";
import { getCurrentAccount, getSigner } from "../../utils/web3Utils";

export const WalletConnect: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      const currentAccount = await getCurrentAccount();
      setAccount(currentAccount);
    };
    
    checkConnection();
    
    // Setup listeners for account changes
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
  
  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install MetaMask to use this application.");
      return;
    }
    
    setIsConnecting(true);
    
    try {
      await getSigner(); // This will prompt MetaMask connection
      const currentAccount = await getCurrentAccount();
      setAccount(currentAccount);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Format address for display
  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <div>
      {account ? (
        <button className="btn btn-sm btn-primary">
          {formatAddress(account)}
        </button>
      ) : (
        <button 
          className="btn btn-sm btn-primary" 
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Connecting...
            </>
          ) : (
            "Connect Wallet"
          )}
        </button>
      )}
    </div>
  );
};