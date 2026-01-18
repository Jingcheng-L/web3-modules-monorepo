"use client";

import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Wallet: NextPage = () => {
  const { address } = useAccount();

  const { data: walletBalance } = useScaffoldReadContract({
    contractName: "Token",
    functionName: "balanceOf",
    args: [address],
  });
  const formatToken = (amount: bigint | undefined) => {
    if (!amount) return "0.00";
    return parseFloat(formatEther(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  return (
    <div className="flex justify-center mt-10 px-4 pb-20">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl font-bold text-primary">{"Wallet"}</h2>
          <p className="text-center text-xs opacity-50 font-mono break-all">{address}</p>

          <div className="stats shadow bg-base-200 mb-6">
            <div className="stat text-center">
              <div className="stat-value text-blue-600 text-3xl">
                {walletBalance ? formatToken(walletBalance) : "0"} <span className="text-sm">TK</span>
              </div>
            </div>
          </div>
          <p></p>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
