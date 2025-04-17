import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { SwapForm } from "~~/components/SwapForm";
import { Header } from "~~/components/Header";

const Swap: NextPage = () => {
  return (
    <>
      <MetaHeader title="Swap | Uniswap V2 UI" description="Swap tokens on Uniswap V2" />
      <Header />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-lg">
          <h1 className="text-center mb-8">
            <span className="block text-3xl font-bold">Swap Tokens</span>
          </h1>
          {/* <SwapForm /> */}
        </div>
      </div>
    </>
  );
};

export default Swap;