"use client";

import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { MetaHeader } from "~~/components/MetaHeader"
import { PoolSelector } from "~~/components/uniswap/PoolSelector";

const SelectPool: NextPage = () => {
  const router = useRouter();
  
  const handlePoolSelect = (pool: any) => {
    // Store the selected pool in localStorage
    localStorage.setItem("selectedPool", JSON.stringify(pool));
    
    // Redirect based on action or default to swap
    const action = router.query.action || "swap";
    router.push(`/${action}`);
  };
  
  return (
    <>
      <MetaHeader title="Select Pool | Uniswap V2 UI" description="Select a liquidity pool" />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-lg">
          <h1 className="text-center mb-8">
            <span className="block text-3xl font-bold">Select a Pool</span>
          </h1>
          <PoolSelector onPoolSelect={handlePoolSelect} />
        </div>
      </div>
    </>
  );
};

export default SelectPool;