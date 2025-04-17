import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { RemoveLiquidity } from "~~/components/RemoveLiquidity";
import { Header } from "~~/components/Header";

const Redeem: NextPage = () => {
  return (
    <>
      <MetaHeader title="Redeem | Uniswap V2 UI" description="Remove liquidity from pools" />
      <Header />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-lg">
          <h1 className="text-center mb-8">
            <span className="block text-3xl font-bold">Remove Liquidity</span>
          </h1>
          <RemoveLiquidity />
        </div>
      </div>
    </>
  );
};

export default Redeem;