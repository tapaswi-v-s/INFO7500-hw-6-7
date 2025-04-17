'use client';
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WalletConnect } from "./WalletConnect";

export const Header: React.FC = () => {
  const router = useRouter();
  
  const isActive = (path: string) => {
    return router.pathname === path ? "bg-primary hover:bg-primary/90" : "hover:bg-base-300";
  };
  
  return (
    <div className="navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-10 shadow-md shadow-secondary px-4 sm:px-6">
      <div className="navbar-start w-auto">
        <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex flex-col">
            <span className="font-bold leading-tight">Uniswap V2 UI</span>
          </div>
        </Link>
        <ul className="menu menu-horizontal px-1 gap-1">
          <li>
            <Link href="/select-pool" className={`px-4 py-2 ${isActive("/select-pool")}`}>
              Select Pool
            </Link>
          </li>
          <li>
            <Link href="/swap" className={`px-4 py-2 ${isActive("/swap")}`}>
              Swap
            </Link>
          </li>
          <li>
            <Link href="/deposit" className={`px-4 py-2 ${isActive("/deposit")}`}>
              Deposit
            </Link>
          </li>
          <li>
            <Link href="/redeem" className={`px-4 py-2 ${isActive("/redeem")}`}>
              Redeem
            </Link>
          </li>
        </ul>
      </div>
      <div className="navbar-end flex-grow mr-4">
        <WalletConnect />
      </div>
    </div>
  );
};