"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { CodeBracketIcon, CpuChipIcon, GlobeAmericasIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  return (
    <div className="bg-base-100 min-h-screen">
      {/* --- Self intro --- */}
      <div className="hero min-h-[70vh] bg-base-200 relative overflow-hidden">
        {/* Decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-30"></div>

        <div className="hero-content flex-col lg:flex-row-reverse gap-12 max-w-7xl px-6">
          {/* Tech stack */}
          <div className="mockup-code bg-neutral text-neutral-content w-full max-w-lg shadow-2xl transform rotate-1 lg:rotate-2 hover:rotate-0 transition-all duration-500">
            <pre data-prefix="$">
              <code>npm install web3-ai-gis</code>
            </pre>
            <pre data-prefix=">" className="text-warning">
              <code>Installing core modules...</code>
            </pre>
            <pre data-prefix=">">
              <code>[+] Solidity & Foundry (Security)</code>
            </pre>
            <pre data-prefix=">">
              <code>[+] Python & PyTorch (AI Agents)</code>
            </pre>
            <pre data-prefix=">">
              <code>[+] GIS & Spatial Data (RWA)</code>
            </pre>
            <pre data-prefix=">" className="text-success">
              <code>Done! Ready to build.</code>
            </pre>
          </div>

          {/* Decorations */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter">
              Code <span className="text-primary">Logic</span>.<br />
              Trust <span className="text-secondary">Math</span>.
            </h1>
            <p className="py-6 text-xl opacity-70 max-w-2xl">
              {"Hi, I'm a "}
              <span className="font-bold text-cyan-500">Web3 Developer</span> aiming at bridging the gap between
              <span className="text-accent font-bold"> Real World Assets </span> and{" "}
              <span className="text-accent font-bold">Artificial Intelligence</span>.
              <br className="hidden lg:block" />I build secure, mathematical, and automated decentralized protocols.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start">
              <a href="#projects" className="btn btn-primary btn-lg rounded-full font-bold shadow-lg shadow-primary/30">
                View DApps
              </a>
              <a href="mailto:jingchengbro@gmail.com" className="btn btn-outline btn-lg rounded-full font-bold">
                Hire Me
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* --- Skills --- */}
      <div className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-1 w-12 bg-primary"></div>
          <h2 className="text-3xl font-black uppercase tracking-widest opacity-80">Tech Arsenal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Skill Card 1: Smart Contracts */}
          <div className="card bg-base-200 border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
            <div className="card-body">
              <CodeBracketIcon className="h-10 w-10 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="card-title text-cyan-500">Smart Contract Engineering</h3>
              <p className="text-sm opacity-70">
                Expert in <strong>Solidity</strong> & <strong>Foundry</strong>. Focus on security, gas optimization, and
                complex mathematical logic (Vesting curves, AMMs).
              </p>
            </div>
          </div>

          {/* Skill Card 2: AI & Data */}
          <div className="card bg-base-200 border border-white/5 hover:border-secondary/50 transition-all duration-300 hover:shadow-xl group">
            <div className="card-body">
              <CpuChipIcon className="h-10 w-10 text-secondary mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="card-title text-cyan-500">AI & Deep Learning</h3>
              <p className="text-sm opacity-70">
                Background in <strong>PyTorch</strong> & <strong>Transformer</strong> architectures. Capable of building
                AI Agents for on-chain automated trading and decision making.
              </p>
            </div>
          </div>

          {/* Skill Card 3: RWA & GIS */}
          <div className="card bg-base-200 border border-white/5 hover:border-accent/50 transition-all duration-300 hover:shadow-xl group">
            <div className="card-body">
              <GlobeAmericasIcon className="h-10 w-10 text-accent mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="card-title text-cyan-500">RWA & Spatial Data</h3>
              <p className="text-sm opacity-70">
                Combining <strong>GIS</strong> expertise with Blockchain to tokenize Real World Assets. Bridging
                physical land data with digital value.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- 3. Featured Projects --- */}
      <div id="projects" className="bg-neutral text-neutral-content py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Featured Protocols</h2>
            <p className="opacity-60 max-w-2xl">
              DApps deployed on Sepolia. Built with Scaffold-ETH 2, Secured by Foundry.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project 1: Vesting */}
            <div className="card bg-base-100 shadow-2xl hover:-translate-y-2 transition-transform duration-300 border-t-4 border-primary">
              <div className="card-body text-base-content">
                <div className="flex justify-between items-start">
                  <h3 className="card-title text-2xl font-bold">CryptoVest</h3>
                  <div className="badge badge-primary badge-outline font-bold">DeFi</div>
                </div>
                <p className="opacity-70 mt-2">
                  A professional Treasury Management System supporting 4 mathematical release curves (Linear, Step,
                  Cliff, Exp). Features RBAC and real-time visualization.
                </p>
                <div className="flex flex-wrap gap-2 my-4">
                  <span className="badge badge-ghost text-xs">Solidity</span>
                  <span className="badge badge-ghost text-xs">Recharts</span>
                  <span className="badge badge-ghost text-xs">AccessControl</span>
                </div>
                <div className="card-actions justify-end mt-auto">
                  <Link href="/vesting" className="btn btn-primary w-full">
                    Launch App 🚀
                  </Link>
                </div>
              </div>
            </div>

            {/* Project 2: Auction */}
            <div className="card bg-base-100 shadow-2xl hover:-translate-y-2 transition-transform duration-300 border-t-4 border-secondary">
              <div className="card-body text-base-content">
                <div className="flex justify-between items-start">
                  <h3 className="card-title text-2xl font-bold">BidProtocol</h3>
                  <div className="badge badge-secondary badge-outline font-bold">Marketplace</div>
                </div>
                <p className="opacity-70 mt-2">
                  A decentralized Auction engine. Includes secure escrow mechanisms (Pull-over-Push). Works on ETH and
                  planned to extend to ERC20.
                </p>
                <div className="flex flex-wrap gap-2 my-4">
                  <span className="badge badge-ghost text-xs">Foundry</span>
                  <span className="badge badge-ghost text-xs">State Machine</span>
                </div>
                <div className="card-actions justify-end mt-auto">
                  <Link href="/auction-eth" className="btn btn-primary w-full">
                    Launch App 🚀
                  </Link>
                </div>
              </div>
            </div>

            {/* Project 3: Permit / Infra */}
            <div className="card bg-base-100 shadow-2xl hover:-translate-y-2 transition-transform duration-300 border-t-4 border-accent">
              <div className="card-body text-base-content">
                <div className="flex justify-between items-start">
                  <h3 className="card-title text-2xl font-bold">Gasless Infra</h3>
                  <div className="badge badge-accent badge-outline font-bold">UX / EIP</div>
                </div>
                <p className="opacity-70 mt-2">
                  Demonstration of EIP-2612 Permit signatures. Enabling gasless approvals and smoother user experience
                  for DeFi protocols.
                </p>
                <div className="flex flex-wrap gap-2 my-4">
                  <span className="badge badge-ghost text-xs">EIP-712</span>
                  <span className="badge badge-ghost text-xs">Viem</span>
                  <span className="badge badge-ghost text-xs">Cryptography</span>
                </div>
                <div className="card-actions justify-end mt-auto">
                  <Link href="/staking" className="btn btn-primary w-full">
                    Launch App 🚀
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 4. About / CTA --- */}
      <div className="hero bg-base-200 py-20">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">From Land Data to Blockchain Data</h2>
            <p className="text-lg opacity-70 mb-8 leading-relaxed">
              {
                "I didn't start as a coder. I started by managing land resources. This background gave me a unique perspective on "
              }
              <strong>Assets, Ownership, and Value</strong>.
              <br />
              <br />
              {
                "Self-taught in the depths of complex systems, I now build infrastructure that ensures trust and transparency. Whether it's an AI Agent or a Vesting Contract, I write code that stands the test of time."
              }
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="https://github.com/Jingcheng-L/"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline gap-2"
              >
                <CodeBracketIcon className="h-5 w-5" /> GitHub
              </a>
              <a href="mailto:jingchengbro@gmail.com" className="btn btn-primary gap-2">
                <RocketLaunchIcon className="h-5 w-5" /> Start a Project
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
