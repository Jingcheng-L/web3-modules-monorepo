// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../contracts/Vesting.sol";

contract VestingTest is Test {
    Vesting public vesting;

    function setUp() public {
        // vesting = new Vesting(vm.addr(1));
    }

}
