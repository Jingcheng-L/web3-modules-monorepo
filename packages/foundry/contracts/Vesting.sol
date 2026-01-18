//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "forge-std/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Vesting is AccessControl, ReentrancyGuard {

    using SafeERC20 for IERC20;
    IERC20 private immutable token;

    // Administrative role
    bytes32 public constant SCHEDULE_MANAGER = keccak256("SCHEDULE_MANAGER");

    // Curve types
    enum CurveType { LINEAR, CLIFF, STEP, EXPONENTIAL }

    struct VestingSchedule {
        CurveType curve;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 start;
        uint256 cliff;
        uint256 duration;
        uint256 interval;
        bool revokable;
        bool revoked;
        string description;
    }

    mapping (address => VestingSchedule[]) beneficiarySchedule;
    bool private constant management = true;
    uint256 public amountReserved = 0;

    constructor(address admin, IERC20 _token) {
        token = _token;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SCHEDULE_MANAGER, admin);
    }

    error AvalaibleAmountNotEnough(address account, uint256 avalaible_amount);
    error NotManagable();
    error NotEnoughToken();
    error ScheduleNotExist();
    error ScheduleNotValid();
    error ScheduleRevoked();
    error ScheduleNotRevokable();
    
    event ClaimSuccess(address indexed account, uint256 amount);

    // --- Schedule operations ---
    function addSchedule(address account, 
                        CurveType _curve,
                        uint256 _totalAmount,
                        uint256 _cliff,
                        uint256 _duration,
                        uint256 _interval,
                        bool _revokable,
                        string memory _description) public onlyRole(SCHEDULE_MANAGER) {
        if(!management) revert NotManagable();
        if(_totalAmount == 0 || _interval == 0) revert ScheduleNotValid();
        if((_totalAmount + amountReserved) > contractBalance()) revert NotEnoughToken();
        amountReserved += _totalAmount;
        beneficiarySchedule[account].push(VestingSchedule({
            curve: _curve,
            totalAmount: _totalAmount,
            releasedAmount: 0,
            start: block.timestamp,
            cliff: _cliff,
            duration: _duration,
            interval: _interval,
            revokable: _revokable,
            revoked: false,
            description: _description
        }));
    }

    function revokeSchedule(address account, uint256 index) public onlyRole(SCHEDULE_MANAGER) {
        if(!management) revert NotManagable();
        if(index >= beneficiarySchedule[account].length) revert ScheduleNotExist();

        VestingSchedule storage sch = beneficiarySchedule[account][index];
        if(sch.revoked) revert ScheduleRevoked();
        if(sch.totalAmount == 0) revert ScheduleNotExist();
        if(!sch.revokable) revert ScheduleNotRevokable();
        amountReserved -= (sch.totalAmount - sch.releasedAmount);
        sch.revoked = true;
    }

    // --- Schedule avalaibility check ---
    modifier validSch(address account, uint256 index) {
        if(index >= beneficiarySchedule[account].length) revert ScheduleNotExist();
        VestingSchedule memory sch = beneficiarySchedule[account][index];
        if(sch.totalAmount == 0 || sch.interval == 0 || sch.revoked) revert ScheduleNotValid();
        _;
    }

    // --- Query current status ---
    function status(address account, uint256 index) public view validSch(account, index) returns (VestingSchedule memory) {
        return beneficiarySchedule[account][index];
    }

    // --- Query claimable amount ---
    function claimableAmount(address account, uint256 index) public view validSch(account, index) returns(uint256) {
        VestingSchedule storage sch = beneficiarySchedule[account][index];
        if(sch.revoked) revert ScheduleRevoked(); 
        uint256 toReleaseAmount = _computeAmountToRelease(sch);
        if(toReleaseAmount <= sch.releasedAmount) return 0;
        uint256 avalaibleAmount = toReleaseAmount - sch.releasedAmount;
        return avalaibleAmount;
    }

    // --- Get schedule count ---
    function getSchedulesCount(address account) public view returns (uint256) {
        return beneficiarySchedule[account].length;
    }

    // --- Claim token of specific amount when avalaible ---
    function claimToken(uint256 index, uint256 amount) public validSch(msg.sender, index) nonReentrant {
        address account = msg.sender;
        VestingSchedule storage sch = beneficiarySchedule[account][index];
        if(sch.revoked) revert ScheduleRevoked(); 
        uint256 toReleaseAmount = _computeAmountToRelease(sch);
        if(toReleaseAmount <= sch.releasedAmount) revert AvalaibleAmountNotEnough(account, 0);
        uint256 avalaibleAmount = toReleaseAmount - sch.releasedAmount;
        if(amount > avalaibleAmount) revert AvalaibleAmountNotEnough(account, avalaibleAmount);
        sch.releasedAmount += amount;
        amountReserved -= amount;
        token.safeTransfer(account, amount);
        emit ClaimSuccess(account, amount);
    }

    // --- Claim all avalaible token ---
    function claimAllToken(uint256 index) public validSch(msg.sender, index) nonReentrant {
        address account = msg.sender;
        VestingSchedule storage sch = beneficiarySchedule[account][index];
        if(sch.revoked) revert ScheduleRevoked(); 
        uint256 toReleaseAmount = _computeAmountToRelease(sch);
        if(toReleaseAmount <= sch.releasedAmount) revert AvalaibleAmountNotEnough(account, 0);
        uint256 avalaibleAmount = toReleaseAmount - sch.releasedAmount;
        sch.releasedAmount += avalaibleAmount;
        amountReserved -= avalaibleAmount;
        token.safeTransfer(account, avalaibleAmount);
        emit ClaimSuccess(account, avalaibleAmount);
    }

    // --- Compute avalaible amount ---
    function _computeAmountToRelease(VestingSchedule memory sch) internal view returns (uint256) {
        CurveType curve = sch.curve;
        if(curve == CurveType.LINEAR) {
            return _computeLinear(sch);
        } else if(curve == CurveType.CLIFF) {
            return _computeCliff(sch);
        } else if(curve == CurveType.STEP) {
            return _computeStep(sch);
        } else if(curve == CurveType.EXPONENTIAL) {
            return _computeExponential(sch);
        } else {
            revert("Unsupported curve type.");
        }
    }

    // --- Curve computations ---
    function _computeLinear(VestingSchedule memory sch) internal view returns (uint256) {
        if(block.timestamp < sch.start) return 0;
        if(block.timestamp >= sch.start + sch.duration) return sch.totalAmount;
        return sch.totalAmount * ( block.timestamp - sch.start ) / sch.duration;
    }
    function _computeCliff(VestingSchedule memory sch) internal view returns (uint256)  {
        if(block.timestamp < sch.start) return 0;
        if(block.timestamp >= sch.start + sch.duration) return sch.totalAmount;
        if(block.timestamp <= sch.cliff) return 0;
        return sch.totalAmount * ( block.timestamp - sch.start ) / sch.duration;
        // return sch.totalAmount * ( block.timestamp - sch.cliff ) / sch.duration;
    }
    function _computeStep(VestingSchedule memory sch) internal view returns (uint256) {
        if(block.timestamp < sch.start) return 0;
        if(block.timestamp >= sch.start + sch.duration) return sch.totalAmount;
        return sch.totalAmount * ((block.timestamp - sch.start) / sch.interval) / (sch.duration / sch.interval);
    }
    function _computeExponential(VestingSchedule memory sch) internal view returns (uint256) {
        if(block.timestamp < sch.start) return 0;
        if(block.timestamp >= sch.start + sch.duration) return sch.totalAmount;
        uint256 elapsed = block.timestamp - sch.start;
        return (sch.totalAmount * elapsed * elapsed) / (sch.duration * sch.duration);
    }

    // --- View contract token balance ---
    function contractBalance() public view returns(uint256) {
        return token.balanceOf(address(this));
    }

}