import { useEffect } from "react";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { MetaHeader } from "../components/MetaHeader";

const Home: NextPage = () => {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/swap");
  }, [router]);
  
  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-2xl mb-2">Redirecting to Swap...</span>
          </h1>
        </div>
      </div>
    </>
  );
};

export default Home;