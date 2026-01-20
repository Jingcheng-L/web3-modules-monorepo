// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "forge-std/Test.sol";
import "../contracts/Vesting.sol"; // 确保路径正确
import "../contracts/Token.sol";

contract VestingTest is Test {
    Vesting public vesting;
    Token public token;

    address public admin = address(this);
    address public beneficiary = address(0xBE);
    address public stranger = address(0xDE);

    uint256 constant TOTAL_AMOUNT = 1000e18;
    uint256 constant DURATION = 100 days;
    uint256 constant INTERVAL = 1 days;
    uint256 constant CLIFF = 20 days;

    function setUp() public {
        token = new Token(admin);
        vesting = new Vesting(admin, IERC20(address(token)));
        
        // 给合约注入代币以支持锁仓计划
        token.mint(address(vesting), 10000e18);
    }

    // =============================================================
    // 1. 权限与管理测试 (Access Control & Admin)
    // =============================================================

    function test_AddSchedule_OnlyManager() public {
        vm.prank(stranger);
        vm.expectRevert(); // 预期因没有 SCHEDULE_MANAGER 角色失败
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, 100, 0, 100, 1, true, "Fail");
    }

    function test_RevokeSchedule_OnlyManager() public {
        // 先以管理员身份添加一个
        vm.prank(admin);
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, 100, 0, 100, 1, true, "ToRevoke");
        
        vm.prank(stranger);
        vm.expectRevert();
        vesting.revokeSchedule(beneficiary, 0);

    }

    // =============================================================
    // 2. 增加计划 (addSchedule) 分支测试
    // =============================================================

    function test_Revert_AddSchedule_InvalidParams() public {
        vm.startPrank(admin);
        
        // 分支: _totalAmount == 0
        vm.expectRevert(Vesting.ScheduleNotValid.selector);
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, 0, 0, 100, 1, true, "");

        // 分支: _interval == 0
        vm.expectRevert(Vesting.ScheduleNotValid.selector);
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, 100, 0, 100, 0, true, "");
        
        vm.stopPrank();
    }

    function test_Revert_AddSchedule_NotEnoughToken() public {
        vm.startPrank(admin);
        uint256 tooMuch = vesting.contractBalance() + 1;
        vm.expectRevert(Vesting.NotEnoughToken.selector);
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, tooMuch, 0, 100, 1, true, "");
        vm.stopPrank();
    }

    // =============================================================
    // 3. 释放曲线算法测试 (Curve Computation Branches)
    // =============================================================

    // --- Unsupported ---
    function test_Unsupported_Branches() public {
        vm.prank(admin);
        vesting.addSchedule(beneficiary, Vesting.CurveType.NOTIMPLEMENTED, TOTAL_AMOUNT, 0, DURATION, INTERVAL, true, "Linear");

        // 分支: block.timestamp < start (测试中通过 warp 模拟)
        // 注意：addSchedule 设置 start = block.timestamp
        
        // 分支: block.timestamp >= start + duration (结束)
        vm.warp(block.timestamp + DURATION + 1);
        
        vm.expectRevert();
        vesting.claimableAmount(beneficiary, 0);
    }

    // --- Linear ---
    function test_LinearCurve_Branches() public {
        vm.prank(admin);
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, TOTAL_AMOUNT, 0, DURATION, INTERVAL, true, "Linear");

        // 分支: block.timestamp < start (测试中通过 warp 模拟)
        // 注意：addSchedule 设置 start = block.timestamp
        
        // 分支: block.timestamp >= start + duration (结束)
        vm.warp(block.timestamp + DURATION + 1);
        assertEq(vesting.claimableAmount(beneficiary, 0), TOTAL_AMOUNT);

        // 分支: 中间值
        vm.warp(block.timestamp - DURATION / 2); 

    }

    // --- Cliff ---
    function test_CliffCurve_Branches() public {
        uint256 startTime = block.timestamp;
        uint256 cliffTime = startTime + CLIFF;
        vm.prank(admin);
        vesting.addSchedule(beneficiary, Vesting.CurveType.CLIFF, TOTAL_AMOUNT, cliffTime, DURATION, INTERVAL, true, "Cliff");

        // 分支: block.timestamp <= cliff
        vm.warp(startTime + CLIFF - 1);
        assertEq(vesting.claimableAmount(beneficiary, 0), 0);

        // 分支: block.timestamp > cliff (跳跃释放)
        vm.warp(startTime + CLIFF + 1);
        uint256 expected = (TOTAL_AMOUNT * (CLIFF + 1)) / DURATION;
        assertEq(vesting.claimableAmount(beneficiary, 0), expected);
    }

    // --- Step ---
    function test_StepCurve_Branches() public {
        uint256 stepInterval = 10 days;
        vm.prank(admin);
        vesting.addSchedule(beneficiary, Vesting.CurveType.STEP, TOTAL_AMOUNT, 0, DURATION, stepInterval, true, "Step");

        // 分支: 时间未到第一个 Step (第 5 天)
        vm.warp(block.timestamp + 5 days);
        assertEq(vesting.claimableAmount(beneficiary, 0), 0);

        // 分支: 刚好到第一个 Step (第 10 天)
        vm.warp(block.timestamp + 5 days);
        assertEq(vesting.claimableAmount(beneficiary, 0), TOTAL_AMOUNT / 10);

        // 分支: 在两个 Step 之间 (第 15 天) - 应该保持 10 天的量
        vm.warp(block.timestamp + 5 days);
        assertEq(vesting.claimableAmount(beneficiary, 0), TOTAL_AMOUNT / 10);
    }

    // --- Exponential ---
    function test_ExponentialCurve_Branches() public {
        vm.prank(admin);
        vesting.addSchedule(beneficiary, Vesting.CurveType.EXPONENTIAL, TOTAL_AMOUNT, 0, DURATION, INTERVAL, true, "Exp");

        // 50% 时间通过，释放量应为 (1/2)^2 = 1/4
        vm.warp(block.timestamp + DURATION / 2);
        assertEq(vesting.claimableAmount(beneficiary, 0), TOTAL_AMOUNT / 4);
    }

    // =============================================================
    // 4. 提取代币 (claimToken & claimAllToken) 分支测试
    // =============================================================

    function test_ClaimToken_Branches() public {
        vm.prank(admin);
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, TOTAL_AMOUNT, 0, DURATION, INTERVAL, true, "Claim");

        vm.warp(block.timestamp + DURATION / 2);
        uint256 half = TOTAL_AMOUNT / 2;

        // 分支: amount > avalaibleAmount (超额提取)
        vm.prank(beneficiary);
        vm.expectRevert(abi.encodeWithSelector(Vesting.AvalaibleAmountNotEnough.selector, beneficiary, half));
        vesting.claimToken(0, half + 1);

        // 分支: 成功提取部分
        vm.prank(beneficiary);
        vesting.claimToken(0, 100);
        assertEq(token.balanceOf(beneficiary), 100);

        // 分支: toReleaseAmount <= releasedAmount (已经提过了)
        // 此时由于时间没动，再次提取全部会导致可用不足
        vm.prank(beneficiary);
        vm.expectRevert(); 
        vesting.claimToken(0, half); 
    }

    function test_ClaimAllToken_Success() public {
        vm.prank(admin);
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, TOTAL_AMOUNT, 0, DURATION, INTERVAL, true, "ClaimAll");
        
        vm.warp(block.timestamp + DURATION);
        vm.prank(beneficiary);
        vesting.claimAllToken(0);
        assertEq(token.balanceOf(beneficiary), TOTAL_AMOUNT);
    }

    // =============================================================
    // 5. 撤销计划 (revokeSchedule) 细节分支
    // =============================================================

    function test_Revoke_Branches() public {
        vm.startPrank(admin);
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, TOTAL_AMOUNT, 0, DURATION, INTERVAL, true, "Revokable");
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, TOTAL_AMOUNT, 0, DURATION, INTERVAL, false, "Non-Revokable");

        vesting.getSchedulesCount(beneficiary);

        // 分支: index >= length
        vm.expectRevert(Vesting.ScheduleNotExist.selector);
        vesting.revokeSchedule(beneficiary, 99);

        // 分支: !sch.revokable
        vm.expectRevert(Vesting.ScheduleNotRevokable.selector);
        vesting.revokeSchedule(beneficiary, 1);

        // 分支: 正常撤销
        vesting.revokeSchedule(beneficiary, 0);

        // 分支: sch.revoked (重复撤销)
        vm.expectRevert(Vesting.ScheduleRevoked.selector);
        vesting.revokeSchedule(beneficiary, 0);

        vm.stopPrank();
    }

    // =============================================================
    // 6. 验证器与查询 (validSch & status)
    // =============================================================

    function test_ValidSch_Modifier_Branches() public {
        vm.prank(admin);
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, TOTAL_AMOUNT, 0, DURATION, INTERVAL, true, "Query");
        
        // 正常查询
        Vesting.VestingSchedule memory sch = vesting.status(beneficiary, 0);
        assertEq(sch.totalAmount, TOTAL_AMOUNT);

        // 分支: index 不存在
        vm.expectRevert(Vesting.ScheduleNotExist.selector);
        vesting.status(beneficiary, 100);
    }

    // =============================================================
    // 7. 边缘 Case: 时间点精准覆盖 (Start/End)
    // =============================================================

    function test_Curve_Time_Boundaries() public {
        vm.prank(admin);
        vesting.addSchedule(beneficiary, Vesting.CurveType.LINEAR, TOTAL_AMOUNT, 0, DURATION, INTERVAL, true, "Bound");
        
        // 分支: block.timestamp == start (释放量应为 0)
        // 注意：addSchedule 里的 start 就是 block.timestamp
        assertEq(vesting.claimableAmount(beneficiary, 0), 0);

        // 分支: block.timestamp == start + duration (释放量应为 Total)
        vm.warp(block.timestamp + DURATION);
        assertEq(vesting.claimableAmount(beneficiary, 0), TOTAL_AMOUNT);
    }
}