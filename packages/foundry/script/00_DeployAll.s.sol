// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/Token.sol";
import "../contracts/Staking.sol";
import "../contracts/Vesting.sol";
import "../contracts/AuctionETHFactory.sol";

/**
 * @notice Deploy script for YourContract contract
 * @dev Inherits ScaffoldETHDeploy which:
 *      - Includes forge-std/Script.sol for deployment
 *      - Includes ScaffoldEthDeployerRunner modifier
 *      - Provides `deployer` variable
 * Example:
 * yarn deploy --file DeployYourContract.s.sol  # local anvil chain
 * yarn deploy --file DeployYourContract.s.sol --network optimism # live network (requires keystore)
 */
contract DeployAll is ScaffoldETHDeploy {
    /**
     * @dev Deployer setup based on `ETH_KEYSTORE_ACCOUNT` in `.env`:
     *      - "scaffold-eth-default": Uses Anvil's account #9 (0xa0Ee7A142d267C1f36714E4a8F75612F20a79720), no password prompt
     *      - "scaffold-eth-custom": requires password used while creating keystore
     *
     * Note: Must use ScaffoldEthDeployerRunner modifier to:
     *      - Setup correct `deployer` account and fund it
     *      - Export contract addresses & ABIs to `nextjs` packages
     */
    function run() external ScaffoldEthDeployerRunner {
        // --- ! Change administrator address before deployment ! ---
        address admin = 0x2E4779aB264d6e6D9D419De045470E95aFCAA22c;
        Token token = new Token(admin);
        new Staking(admin, token);
        Vesting vesting = new Vesting(admin, token);
        new AuctionETHFactory(admin);
        new AuctionETH(
            address(0),
            payable(address(0)),
            "0",
            0,
            1,
            payable(address(0))
        );
    }
}
