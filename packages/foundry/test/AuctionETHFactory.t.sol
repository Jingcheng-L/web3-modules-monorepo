// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "forge-std/Test.sol";
import "../contracts/AuctionETHFactory.sol"; // 修改为你的实际路径

contract AuctionETHFactoryTest is Test {
    AuctionETHFactory public factory;
    
    address public admin = address(0x1);
    address public creator = address(0x2);
    address public beneficiary = address(0x3);

    // 定义与 Factory 中一致的事件，用于测试 vm.expectEmit
    event AuctionCreated(address auctionAddress, address creator, string description);

    function setUp() public {
        // 部署 Factory
        factory = new AuctionETHFactory(admin);
    }

    // --- 构造函数测试 ---
    function test_Constructor() public {
        assertEq(factory.platformOwner(), admin);
    }

    // --- 创建拍卖测试 ---
    function test_CreateAuction() public {
        string memory desc = "Test Auction";
        uint256 ratio = 500; // 5%
        uint256 time = 3600; // 1 hour

        vm.prank(creator);
        factory.createAuction(desc, ratio, time, payable(beneficiary));

        // 验证数组长度增加
        assertEq(factory.getAuctions().length, 1);
        
        // 验证存储的地址不是零地址
        address auctionAddr = factory.auctions(0);
        assertTrue(auctionAddr != address(0));
    }

    // --- 列表查询测试 ---
    function test_GetAuctions() public {
        vm.startPrank(creator);
        factory.createAuction("A1", 10, 10, payable(beneficiary));
        factory.createAuction("A2", 20, 20, payable(beneficiary));
        factory.createAuction("A3", 30, 30, payable(beneficiary));
        vm.stopPrank();

        address[] memory allAuctions = factory.getAuctions();
        assertEq(allAuctions.length, 3);
        assertEq(allAuctions[0], factory.auctions(0));
        assertEq(allAuctions[1], factory.auctions(1));
        assertEq(allAuctions[2], factory.auctions(2));
    }

    // --- 集成测试：验证生成的 Auction 属性 (可选) ---
    // 这需要 Factory 部署的 AuctionETH 确实有这些 getter 函数
    /*
    function test_DeployedAuctionProperties() public {
        vm.prank(creator);
        factory.createAuction("Detail Check", 500, 3600, payable(beneficiary));
        
        AuctionETH spawnedAuction = AuctionETH(payable(factory.auctions(0)));
        
        // 假设 AuctionETH 暴露了这些变量
        // assertEq(spawnedAuction.description(), "Detail Check");
        // assertEq(spawnedAuction.beneficiary(), beneficiary);
    }
    */
}