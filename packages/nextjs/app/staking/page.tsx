"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { formatEther, hexToSignature, parseEther } from "viem";
import { useAccount, useSignTypedData } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useAllContracts } from "~~/utils/scaffold-eth/contractsData";

// 定义签名数据结构
interface SignatureData {
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
  deadline: bigint;
  amount: bigint;
}

const Stake: NextPage = () => {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { targetNetwork } = useTargetNetwork();

  // 状态管理
  const [permitAmount, setPermitAmount] = useState<string>("0");
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);

  // --- 1. 读取数据 (使用 useScaffoldReadContract) ---
  const tokenAddress = useAllContracts()["Token"]["address"];
  const stakingAddress = useAllContracts()["Staking"]["address"];

  // 获取用户当前的 Nonce
  const { data: nonce } = useScaffoldReadContract({
    contractName: "Token",
    functionName: "nonces",
    args: [address],
  });

  // 获取质押余额
  const { data: stakingBalance } = useScaffoldReadContract({
    contractName: "Staking",
    functionName: "balanceOf",
    args: [address],
  });

  // --- 2. 写入数据 (使用 useScaffoldWriteContract) ---
  const { writeContractAsync: writeStakeAsync } = useScaffoldWriteContract({ contractName: "Staking" });

  // --- 3. 逻辑函数 ---

  // 签名逻辑 (Permit)
  const handleSign = async () => {
    if (!address || !tokenAddress || !stakingAddress || nonce === undefined) {
      console.error("Missing required data for signing");
      return;
    }

    try {
      const amount = parseEther(permitAmount);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1小时后过期

      const domain = {
        name: "Token", // 需与你 Solidity 中的 ERC20Permit 名字一致
        version: "1",
        chainId: targetNetwork.id,
        verifyingContract: tokenAddress,
      } as const;

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      } as const;

      const message = {
        owner: address,
        spender: stakingAddress,
        value: amount,
        nonce: nonce,
        deadline: deadline,
      } as const;

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: "Permit",
        message,
      });

      const { v, r, s } = hexToSignature(signature);

      // 保存签名数据到状态
      setSignatureData({
        v: Number(v),
        r,
        s,
        deadline,
        amount,
      });

      console.log("Permit 签名成功:", { v, r, s });
    } catch (error) {
      console.error("签名失败", error);
    }
  };

  // 质押逻辑 (Stake)
  const handleStake = async () => {
    if (!signatureData) {
      console.error("No signature data found. Please sign first.");
      return;
    }

    try {
      // 调用合约的 stakePermit (请确保 Solidity 中函数名和参数顺序一致)
      // 假设 Solidity 函数定义: stakePermit(uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
      await writeStakeAsync({
        functionName: "stakePermit",
        args: [signatureData.amount, signatureData.deadline, signatureData.v, signatureData.r, signatureData.s],
      });

      // 成功后重置签名数据
      setSignatureData(null);
    } catch (error) {
      console.error("质押交易失败", error);
    }
  };

  return (
    <div className="flex justify-center mt-10 px-4 pb-20">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl font-bold text-primary">Staking</h2>
          <p className="text-center text-xs opacity-50 font-mono break-all">{address}</p>

          <div className="stats shadow bg-base-200 mb-6">
            <div className="stat text-center">
              <div className="stat-title">Staking Balance</div>
              <div className="stat-value text-blue-600 text-3xl">
                {stakingBalance ? formatEther(stakingBalance) : "0"} <span className="text-sm">TK</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <input
              type="number"
              placeholder="Amount to stake"
              className="input input-bordered w-full"
              value={permitAmount}
              onChange={e => setPermitAmount(e.target.value)}
            />

            <div className="flex gap-2">
              {/* 步骤 1: 签名 */}
              <button className={`btn flex-1 ${signatureData ? "btn-success" : "btn-primary"}`} onClick={handleSign}>
                {signatureData ? "Signed ✓" : "1. Sign Permit"}
              </button>

              {/* 步骤 2: 质押 */}
              <button
                className="btn btn-secondary flex-1"
                onClick={handleStake}
                disabled={!signatureData} // 必须先签名
              >
                2. Stake
              </button>
            </div>

            {signatureData && (
              <p className="text-[10px] text-green-600 text-center font-mono">Signature ready to use</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stake;
