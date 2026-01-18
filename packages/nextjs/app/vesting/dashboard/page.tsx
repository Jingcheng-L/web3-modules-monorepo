"use client";

import { useState } from "react";
import VestingChart from "../components/chart";
import { AddressInput } from "@scaffold-ui/components";
import { IntegerInput } from "@scaffold-ui/debug-contracts";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const VestingPage: NextPage = () => {
  // --- 表单状态 ---
  const [form, setForm] = useState({
    beneficiary: "",
    totalAmount: "",
    totalAmountEther: "",
    duration: "31536000", // 默认1年
    interval: "2592000", // 默认1个月
    cliff: "0",
    description: "",
    curve: 0,
  });

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
  const addSchedule = () =>
    writeVestingAsync({
      functionName: "addSchedule",
      args: [
        form.beneficiary,
        form.curve,
        form.totalAmount ? BigInt(form.totalAmount) : 0n,
        form.cliff ? BigInt(form.cliff) : 0n,
        form.duration ? BigInt(form.duration) : 0n,
        BigInt(form.interval),
        true, // revokable
        form.description,
      ],
    });
  const toFixed2 = (amount: bigint | undefined) => {
    if (!amount) return "0.00";
    return parseFloat(formatEther(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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
          {/* 1. 管理员面板 (在上) */}
          <section className="bg-base-100 p-8 rounded-3xl border border-white/5 shadow-2xl text-base-content">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-2 bg-primary rounded-full"></div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Create Release Plan</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="form-control">
                <label className="label text-xs font-black opacity-60 uppercase">Beneficiary Address</label>
                <AddressInput value={form.beneficiary} onChange={val => setForm({ ...form, beneficiary: val })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label text-xs font-black opacity-60 uppercase">Total Tokens</label>
                  <IntegerInput
                    disableMultiplyBy1e18
                    value={form.totalAmountEther}
                    onChange={val =>
                      setForm({ ...form, totalAmount: parseEther(val).toString(), totalAmountEther: val.toString() })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label text-xs font-black opacity-60 uppercase">Curve Strategy</label>
                  <select
                    className="select select-bordered w-full font-bold"
                    onChange={e => setForm({ ...form, curve: parseInt(e.target.value) })}
                  >
                    <option value={0}>Linear</option>
                    <option value={1}>Cliff + Linear</option>
                    <option value={2}>Step-wise (Bucket)</option>
                    <option value={3}>Exponential (Accelerated)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="form-control">
                  <label className="label text-xs font-black opacity-60 uppercase">Duration (Seconds)</label>
                  <IntegerInput
                    disableMultiplyBy1e18
                    value={form.duration}
                    onChange={val => setForm({ ...form, duration: val.toString() })}
                  />
                </div>
                <div className="form-control">
                  <label className="label text-xs font-black opacity-60 uppercase">Interval (Seconds)</label>
                  <IntegerInput
                    disableMultiplyBy1e18
                    value={form.interval}
                    onChange={val => setForm({ ...form, interval: val.toString() })}
                  />
                </div>
                <div className="form-control">
                  <label className="label text-xs font-black opacity-60 uppercase">Cliff (Timestamp By Sec)</label>
                  <IntegerInput
                    disableMultiplyBy1e18
                    value={form.cliff}
                    onChange={val => setForm({ ...form, cliff: val.toString() })}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label text-xs font-black opacity-60 uppercase">Description / Memo</label>
                <input
                  className="input input-bordered w-full"
                  placeholder="e.g. Seed Investors Group A"
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <button className={`btn btn-primary btn-lg w-full mt-4 font-black`} onClick={() => addSchedule()}>
                AUTHORIZE & DEPLOY PLAN
              </button>
            </div>
          </section>

          {/* 2. 用户看板 (在下) */}
          <section>
            {form?.totalAmount && parseEther(form.totalAmount) > 0n ? (
              <section className="mb-6">
                <div className="bg-base-100 rounded-3xl p-8 border border-white/5 shadow-2xl text-base-content">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                      <h3 className="text-3xl font-black text-primary uppercase">Release Curve Preview</h3>
                      <p className="text-xs font-bold opacity-50 mt-1">
                        STRATEGY: {["LINEAR", "CLIFF", "STEP", "EXP"][Number(form.curve)]}
                      </p>
                    </div>
                  </div>

                  <div className="mb-8"></div>
                  <VestingChart schedule={form} />
                </div>
              </section>
            ) : (
              <section>
                <div className="bg-base-100/30 border-2 border-dashed border-white/10 rounded-3xl p-20 text-center">
                  <p className="text-3xl opacity-40 font-bold uppercase tracking-widest text-cyan-500">
                    Complete the form to preview release curve.
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
