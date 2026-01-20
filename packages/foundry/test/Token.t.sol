// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../contracts/Token.sol"; // 确保路径正确

contract TokenTest is Test {
    Token public token;

    address public admin = address(0xAD);
    address public manager = address(0xDE);
    address public user = address(0x123);
    address public stranger = address(0x456);

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER");

    function setUp() public {
        // 部署合约，设置 admin
        token = new Token(admin);

        // admin 给 manager 授权
        vm.prank(admin);
        token.grantRole(MANAGER_ROLE, manager);
    }

    // --- 初始状态测试 ---
    function testMetadata() public {
        assertEq(token.name(), "Token");
        assertEq(token.symbol(), "TK");
    }

    function testInitialRoles() public {
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(token.hasRole(MANAGER_ROLE, admin));
        assertTrue(token.hasRole(MANAGER_ROLE, manager));
    }

    // --- 铸造 (Mint) 测试 ---
    function testMintAsManager() public {
        uint256 amount = 1000e18;
        vm.prank(manager);
        token.mint(user, amount);

        assertEq(token.balanceOf(user), amount);
        assertEq(token.totalSupply(), amount);
    }

    function testRevertMintAsStranger() public {
        vm.prank(stranger);
        // 预期报错，AccessControl 的报错通常包含角色 hash
        vm.expectRevert();
        token.mint(stranger, 100e18);
    }

    // --- Permit (EIP-2612) 签名授权测试 ---
    function testPermit() public {
        // 1. 准备签名者信息
        uint256 ownerPrivateKey = 0xA11CE; // 模拟私钥
        address owner = vm.addr(ownerPrivateKey);
        address spender = address(0xB0B);
        uint256 value = 500e18;
        uint256 deadline = block.timestamp + 1 days;

        // 2. 获取当前 nonce (ERC20Permit 逻辑)
        uint256 nonce = token.nonces(owner);

        // 3. 计算 EIP-712 结构化哈希
        // 注意：Foundry 提供了 computeDomainSeparator，但手动计算更能体现原理
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                spender,
                value,
                nonce,
                deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", token.DOMAIN_SEPARATOR(), structHash)
        );

        // 4. 对哈希进行签名
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);

        // 5. 执行 permit
        token.permit(owner, spender, value, deadline, v, r, s);

        // 6. 验证 allowance 是否生效
        assertEq(token.allowance(owner, spender), value);
    }

    // --- 权限管理测试 ---
    function testRevokeManagerRole() public {
        // Admin 撤回 Manager 的权限
        vm.prank(admin);
        token.revokeRole(MANAGER_ROLE, manager);

        // 再次尝试铸造应该失败
        vm.prank(manager);
        vm.expectRevert();
        token.mint(user, 100e18);
    }
}