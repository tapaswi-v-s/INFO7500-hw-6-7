"use client";
import React, { useState, useEffect } from "react";

interface Token {
  address: string;
  symbol: string;
  balance?: string;
}

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken?: Token | null;
  onSelectToken: (token: Token) => void;
  label?: string;
  disabled?: boolean;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokens,
  selectedToken,
  onSelectToken,
  label = "Select Token",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isOpen && !(event.target as HTMLElement).closest(".token-selector")) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);
  
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };
  
  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    setIsOpen(false);
  };
  
  return (
    <div className="token-selector relative">
      <div 
        className={`
          flex justify-between items-center p-2 border rounded cursor-pointer
          ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-base-200"}
        `}
        onClick={toggleDropdown}
      >
        <div className="flex items-center">
          {selectedToken ? (
            <>
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                {selectedToken.symbol.charAt(0)}
              </div>
              <span>{selectedToken.symbol}</span>
            </>
          ) : (
            <span className="text-base-content/70">{label}</span>
          )}
        </div>
        <div className="ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 border rounded bg-base-100 shadow-xl z-50 max-h-60 overflow-y-auto">
          {tokens.length === 0 ? (
            <div className="p-3 text-center text-base-content/70">No tokens available</div>
          ) : (
            tokens.map((token) => (
              <div
                key={token.address}
                className={`
                  flex items-center p-3 hover:bg-base-200 cursor-pointer
                  ${selectedToken?.address === token.address ? "bg-base-200" : ""}
                `}
                onClick={() => handleSelectToken(token)}
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                  {token.symbol.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{token.symbol}</span>
                  {token.balance && (
                    <span className="text-xs text-base-content/70">Balance: {token.balance}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};