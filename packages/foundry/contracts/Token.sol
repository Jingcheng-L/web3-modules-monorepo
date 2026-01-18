//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "forge-std/console.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Token is ERC20, ERC20Permit, AccessControl {
    bytes32 public constant MANAGER = keccak256("MANAGER");
    constructor(address admin) ERC20("Token", "TK") ERC20Permit("Token") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER, admin);
    }
    function mint(address beneficiary, uint256 amount) external onlyRole(MANAGER) {
        _mint(beneficiary, amount);
    }
    function burn(address target, uint256 amount) public onlyRole(MANAGER) {
        _burn(target, amount);
    }
}