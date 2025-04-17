import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { AddLiquidity } from "~~/components/AddLiquidity";
import { Header } from "~~/components/Header";

const Deposit: NextPage = () => {
  return (
    <>
      <MetaHeader title="Deposit | Uniswap V2 UI" description="Add liquidity to pools" />
      <Header />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-lg">
          <h1 className="text-center mb-8">
            <span className="block text-3xl font-bold">Add Liquidity</span>
          </h1>
          <AddLiquidity />
        </div>
      </div>
    </>
  );
};

export default Deposit;