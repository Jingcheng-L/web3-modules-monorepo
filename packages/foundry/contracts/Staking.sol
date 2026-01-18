//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "forge-std/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Staking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 private immutable token;
    mapping (address => uint256) public balances;
    constructor(address admin, IERC20 _token) {
        token = _token;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    event doneStake(address from, uint256 amount);

    // --- Approve + Transfer ---
    function stake(uint256 amount) external {

        address from = msg.sender;

        token.safeTransferFrom(from, address(this), amount);

        emit doneStake(from, amount);

        balances[from] += amount;

    }

    // --- Permit + Transfer ---
    function stakePermit(uint256 amount,
                        uint256 deadline,
                        uint8 v,
                        bytes32 r,
                        bytes32 s) external {
        
        address from = msg.sender;

        IERC20Permit(address(token)).permit(
            from,
            address(this),
            amount,
            deadline,
            v, r, s
        );

        token.safeTransferFrom(from, address(this), amount);

        emit doneStake(from, amount);

        balances[from] += amount;
    }

    // --- Read Balance ---
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}