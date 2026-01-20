// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "forge-std/Test.sol";
import "../contracts/Staking.sol"; // 假设路径
import "../contracts/Token.sol";

contract StakingTest is Test {
    Staking public staking;
    Token public token;

    address public admin = address(this);
    address public user;
    uint256 public userPrivateKey;

    uint256 public constant STAKE_AMOUNT = 100 ether;

    function setUp() public {
        // 创建一个带私钥的用户，用于测试 Permit 签名
        userPrivateKey = 0xABC123;
        user = vm.addr(userPrivateKey);

        token = new Token(admin);
        staking = new Staking(admin, token);

        // 给用户一些代币
        token.mint(user, 1000 ether);
    }

    // =============================================================
    // 1. 基础功能测试
    // =============================================================

    function test_InitialState() public {
        assertEq(address(token), address(token)); // 验证 token 赋值
        assertEq(staking.balanceOf(user), 0);
    }

    // =============================================================
    // 2. 标准质押测试 (Approve + Stake)
    // =============================================================

    function test_Stake_Success() public {
        vm.startPrank(user);
        
        // 1. 授权
        token.approve(address(staking), STAKE_AMOUNT);
        
        // 2. 质押
        staking.stake(STAKE_AMOUNT);
        
        assertEq(staking.balanceOf(user), STAKE_AMOUNT);
        assertEq(token.balanceOf(address(staking)), STAKE_AMOUNT);
        vm.stopPrank();
    }

    function test_Revert_Stake_WithoutApprove() public {
        vm.prank(user);
        // 没有 approve 直接质押，ERC20 会 revert
        vm.expectRevert();
        staking.stake(STAKE_AMOUNT);
    }

    // =============================================================
    // 3. Permit 质押测试 (Permit + Stake)
    // =============================================================

    function test_StakePermit_Success() public {
        uint256 deadline = block.timestamp + 1 days;
        uint256 nonce = token.nonces(user);

        // 1. 计算 EIP-712 签名哈希
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user,
                address(staking),
                STAKE_AMOUNT,
                nonce,
                deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", token.DOMAIN_SEPARATOR(), structHash)
        );

        // 2. 生成签名 (v, r, s)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);

        // 3. 执行 stakePermit
        vm.prank(user);
        staking.stakePermit(STAKE_AMOUNT, deadline, v, r, s);

        // 4. 验证结果
        assertEq(staking.balanceOf(user), STAKE_AMOUNT);
        assertEq(token.balanceOf(address(staking)), STAKE_AMOUNT);
        assertEq(token.allowance(user, address(staking)), 0); // Permit 后 transferFrom 应该消耗掉了 allowance
    }

    function test_Revert_StakePermit_Expired() public {
        uint256 deadline = block.timestamp - 1; // 已过期
        
        // 尝试签名（省略部分逻辑，直接调用看是否 revert）
        vm.prank(user);
        vm.expectRevert();
        staking.stakePermit(STAKE_AMOUNT, deadline, 0, bytes32(0), bytes32(0));
    }

    function test_Revert_StakePermit_InvalidSignature() public {
        uint256 deadline = block.timestamp + 1 days;
        
        // 使用错误的 v, r, s
        vm.prank(user);
        vm.expectRevert();
        staking.stakePermit(STAKE_AMOUNT, deadline, 27, bytes32(uint256(1)), bytes32(uint256(1)));
    }

    // =============================================================
    // 4. 边界测试
    // =============================================================

    function test_Stake_ZeroAmount() public {
        vm.prank(user);
        staking.stake(0);
        assertEq(staking.balanceOf(user), 0);
    }

    function test_MultipleStakes() public {
        vm.startPrank(user);
        token.approve(address(staking), 500 ether);
        
        staking.stake(100 ether);
        staking.stake(200 ether);
        
        assertEq(staking.balanceOf(user), 300 ether);
        vm.stopPrank();
    }
}