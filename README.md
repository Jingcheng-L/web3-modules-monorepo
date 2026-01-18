# Web3 Developer Suite

This repository contains a full-stack Web3 portfolio built with **Scaffold-ETH 2**. It demonstrates core DeFi mechanisms including an Upgradable Infrastructure, a flexible Vesting system, and gasless Permit implementations.

**Live Demo**
**Verified Contract**

## Features & Architecture

### 1. Token Vesting System (Core)
A contract to manage token release schedules for teams, investors, and advisors.
*   **Multi-Curve Support**: Implements Linear, Cliff, Step-wise (Periodic), and Exponential release logic.
*   **Accounting Safety**: Uses an `amountReserved` state variable to track liabilities, ensuring the contract never over-commits tokens it doesn't hold.
*   **Frontend Visualization**: Custom React components using `Recharts` to render vesting schedules and "claimable amount" in real-time.
*   **Role-Based Control**: Admin functions are protected by `AccessControl` (ready for Multi-sig integration).

### 2. Auction Protocol
A decentralized bidding engine for ERC20 tokens/NFTs.
*   **Anti-Sniping**: Implements "Time Extension" logic (auction extends by 5 mins if a bid is placed in the last 5 mins).
*   **Pull-over-Push**: Uses a withdrawal pattern for outbid refunds to prevent Reentrancy attacks and DoS risks.

### 3. Infrastructure
*   **UUPS Upgradeable Token**: An ERC20 token using the UUPS proxy pattern for future-proofing.
*   **ERC20 Permit**: Demonstrates EIP-2612 gasless approvals using `viem` signature handling.


## Tech Stack

*   **Smart Contracts**: Solidity ^0.8.20
*   **Testing**: Foundry (100% unit test coverage for core math logic)
*   **Frontend**: Next.js (App Router), RainbowKit, Wagmi, Viem
*   **UI Library**: Tailwind CSS, DaisyUI, Recharts


## Technical Highlights & Decisions

*(Thinking process behind the code)*

### 1. Math & Precision
Solidity lacks floating-point support. For the vesting curves (especially Step and Exponential), I strictly followed the **"Multiply before Divide"** rule to minimize precision loss.
```solidity
// Example: Step calculation
return (totalAmount * currentStep) / totalSteps;
```

### 2. Gas Optimization vs. UX

For the Vesting contract, I chose to store vesting schedules in a mapping rather than an array to optimize gas for lookups. However, to display  user data on the frontend, I implemented a helper loop in React that  fetches data concurrently using Promise.all based on the schedule count.

### 3. Security Patterns

- **Checks-Effects-Interactions**: Strictly followed in all claim and withdraw functions.
- **ReentrancyGuard**: Applied to all functions involving token transfers.
- **Input Validation**: Strict checks for address(0) and zero amounts.


## How to Run

1. **Clone & Install**
   ```bash
   git clone https://github.com/YOUR_USERNAME/repo-name.git
   yarn install
   ```

2. **Start Local Chain**
   ```bash
   yarn chain
   ```

3. **Deploy Contracts**
   ```bash
   # Deploys Token, Vesting, and Auction in order
   yarn deploy
   ```

4. **Start Frontend**
   ```bash
   yarn start
   ```

5. **Run Tests**
   ```bash
   cd packages/foundry
   forge test
   ```


## About Me

I am a self-taught Web3 Developer with a background in Land Resource Management. My transition to engineering is driven by a strong interest in **Logic, System Architecture, and Real World Assets (RWA)**.

I focus on writing clean, secure, and testable code.

*   **Contact**: [Your Email / Telegram]
*   **GitHub**: [Your GitHub Profile]
