"use client";

import { useEffect, useState } from "react";
import VestingChart from "../components/chart";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const VestingPage: NextPage = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  // --- 合约全局数据读取 ---
  const { data: reservedAmount } = useScaffoldReadContract({
    contractName: "Vesting",
    functionName: "amountReserved",
  });

  const { data: contractBalance } = useScaffoldReadContract({
    contractName: "Vesting",
    functionName: "contractBalance",
  });

  // --- 发起交易 ---
  const { writeContractAsync: writeVestingAsync } = useScaffoldWriteContract({ contractName: "Vesting" });
  const claimAll = (index: bigint) =>
    writeVestingAsync({
      functionName: "claimAllToken",
      args: [index],
    });

  const toFixed2 = (amount: bigint | undefined) => {
    if (!amount) return "0.00";
    return parseFloat(formatEther(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // 假设你在合约里加了获取方案数量的函数，如果没有，可以先硬编码 index 测试
  // 为了完整演示，我们假设只读第0条数据，你可以根据需要扩展为循环渲

  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const { data: deployedContractData } = useDeployedContractInfo("Vesting");
  const { data: schedulesCount } = useScaffoldReadContract({
    contractName: "Vesting",
    functionName: "getSchedulesCount",
    args: [address],
  });

  // --- 2. 核心：循环读取逻辑 ---
  useEffect(() => {
    const fetchAllSchedules = async () => {
      if (!address || !schedulesCount || !deployedContractData || !publicClient) return;

      setIsLoadingSchedules(true);
      try {
        const count = Number(schedulesCount);
        const promises = [];

        // 准备所有并发请求
        for (let i = 0; i < count; i++) {
          promises.push(
            publicClient.readContract({
              address: deployedContractData.address,
              abi: deployedContractData.abi,
              functionName: "status",
              args: [address, BigInt(i)],
            }),
          );
        }

        // 一次性并发读取，效率最高
        const results = await Promise.all(promises);

        // 同时读取每个计划的 claimableAmount
        const claimablePromises = [];
        for (let i = 0; i < count; i++) {
          claimablePromises.push(
            publicClient.readContract({
              address: deployedContractData.address,
              abi: deployedContractData.abi,
              functionName: "claimableAmount",
              args: [address, BigInt(i)],
            }),
          );
        }
        const claimableResults = await Promise.all(claimablePromises);

        // 合并数据
        const combined = results.map((sch: any, idx: number) => ({
          ...sch,
          claimable: claimableResults[idx],
          index: idx,
        }));

        setAllSchedules(combined);
      } catch (e) {
        console.error("Error fetching schedules:", e);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    fetchAllSchedules();
  }, [address, schedulesCount, deployedContractData, publicClient]);

  return (
    <div className="flex flex-col items-center text-neutral-content min-h-screen pb-20 font-sans">
      <div className="max-w-4xl w-full px-6">
        {/* Header区 */}
        <div className="flex justify-between items-center py-10">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-warning">
              CRYPTO<span className="text-primary">VEST</span>
            </h1>
            <p className="text-xs opacity-50 font-bold mt-1 text-stone-700">PROFESSIONAL TOKEN MANAGEMENT</p>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-xs uppercase opacity-40 font-black text-teal-400">Contract Balance</p>
              <p className="text-2xl font-mono font-bold text-primary">{toFixed2(contractBalance)}</p>
            </div>
            <div className="text-right border-l border-white/10 pl-6">
              <p className="text-xs uppercase opacity-40 font-black text-teal-400">Reserved</p>
              <p className="text-2xl font-mono font-bold text-warning">{toFixed2(reservedAmount)}</p>
            </div>
          </div>
        </div>

        {/* 垂直布局容器 */}
        <div className="flex flex-col gap-10">
          {/* 2. 用户看板 (在下) */}
          <section>
            {isLoadingSchedules ? (
              <section>Loading</section>
            ) : allSchedules.length > 0 ? (
              allSchedules.map((firstSchedule, _idx) =>
                firstSchedule?.totalAmount && firstSchedule.totalAmount > 0n ? (
                  <section key={firstSchedule.index ?? _idx} className="mb-6">
                    <div className="bg-base-100 rounded-3xl p-8 border border-white/5 shadow-2xl text-base-content">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                          <h3 className="text-3xl font-black text-primary uppercase">
                            {firstSchedule.description || "Project Tokens"}
                          </h3>
                          <p className="text-xs font-bold opacity-50 mt-1">
                            STRATEGY: {["LINEAR", "CLIFF", "STEP", "EXP"][Number(firstSchedule.curve)]}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl text-right min-w-[200px]">
                          <p className="text-3xl font-mono font-black text-primary">
                            {toFixed2(firstSchedule.totalAmount)}
                          </p>
                          <p className="text-xs font-bold opacity-40 uppercase">Total Allocation</p>
                        </div>
                      </div>

                      <div className="mb-8">
                        <div className="flex justify-between text-xs font-black mb-2 opacity-60 uppercase tracking-widest">
                          <span>Vesting Progress</span>
                          <span>
                            {((Number(firstSchedule.releasedAmount) / Number(firstSchedule.totalAmount)) * 100).toFixed(
                              2,
                            )}
                            %
                          </span>
                        </div>
                        <progress
                          className="progress progress-primary w-full h-6"
                          value={Number(firstSchedule.releasedAmount)}
                          max={Number(firstSchedule.totalAmount)}
                        ></progress>
                      </div>
                      <VestingChart schedule={firstSchedule} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                        <div className="bg-base-200 p-6 rounded-2xl border border-white/5">
                          <p className="text-xs font-black opacity-40 uppercase mb-1">Available to Withdraw</p>
                          <p className="text-4xl font-mono font-black text-success">
                            {toFixed2(firstSchedule.claimable)}
                          </p>
                        </div>
                        <div className="bg-base-200 p-6 rounded-2xl border border-white/5">
                          <p className="text-xs font-black opacity-40 uppercase mb-1">Already Claimed</p>
                          <p className="text-4xl font-mono font-black text-sky-500/75">
                            {toFixed2(firstSchedule.releasedAmount)}
                          </p>
                        </div>
                      </div>

                      <button
                        className="btn btn-success btn-xl w-full mt-8 rounded-2xl text-white font-black text-xl shadow-xl shadow-success/10"
                        onClick={() => claimAll(BigInt(_idx))}
                        disabled={firstSchedule.claimable === 0n}
                      >
                        {firstSchedule.claimable && firstSchedule.claimable > 0n
                          ? `WITHDRAW ${toFixed2(firstSchedule.claimable)} TOKENS`
                          : "NOTHING TO CLAIM YET"}
                      </button>
                    </div>
                  </section>
                ) : null,
              )
            ) : (
              <section>
                <div className="bg-base-100/30 border-2 border-dashed border-white/10 rounded-3xl p-20 text-center">
                  <p className="text-3xl opacity-40 font-bold uppercase tracking-widest text-cyan-500">
                    No Active Plans for this Address
                  </p>
                  <p className="text-lg opacity-30 mt-2 text-cyan-500">
                    Connect a different wallet or ask admin to create a plan.
                  </p>
                </div>
              </section>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default VestingPage;
