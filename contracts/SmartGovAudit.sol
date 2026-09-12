// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SmartGovAudit
 * @author SmartGov Core Engineering & Security Team
 * @notice Immutable, tamper-evident audit ledger for civic grievance management.
 * @dev Stores cryptographic proofs, lifecycle transitions, and resolution certifications.
 *      Personally Identifiable Information (PII) and full complaint descriptions remain strictly off-chain.
 */
contract SmartGovAudit is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    enum Priority {
        None,
        Low,
        General,
        High,
        Urgent
    }

    enum GrievanceStatus {
        None,
        Open,
        InProgress,
        Transferred,
        Resolved,
        Closed
    }

    struct ActionEventRecord {
        bytes32 actionHash;
        GrievanceStatus status;
        bytes32 departmentHash;
        uint256 timestamp;
        string actionType;
    }

    // Storage-optimized struct layout: 5 storage slots total (160 bytes)
    struct ComplaintRecord {
        bytes32 complaintHash;       // Slot 0 (32 bytes)
        bytes32 departmentHash;      // Slot 1 (32 bytes)
        bytes32 latestActionHash;    // Slot 2 (32 bytes)
        bytes32 resolutionHash;      // Slot 3 (32 bytes)
        uint64 registeredAt;         // Slot 4 (8 bytes)  ┐
        uint64 updatedAt;            // Slot 4 (8 bytes)  │ tightly packed into Slot 4
        uint32 actionCount;          // Slot 4 (4 bytes)  │ (8 + 8 + 4 + 1 + 1 + 1 = 23 bytes <= 32)
        Priority priority;           // Slot 4 (1 byte)   │
        GrievanceStatus status;      // Slot 4 (1 byte)   │
        bool exists;                 // Slot 4 (1 byte)   ┘
    }

    // Mapping: complaintId (bytes32 keccak256 of complaint string ID) => ComplaintRecord
    mapping(bytes32 => ComplaintRecord) private _complaints;

    // Mapping: complaintId => array of historical audit events
    mapping(bytes32 => ActionEventRecord[]) private _auditHistory;

    // Total registered grievances counter
    uint256 public totalComplaints;

    // Events for indexed on-chain querying
    event ComplaintRegistered(
        bytes32 indexed id,
        bytes32 indexed complaintHash,
        bytes32 departmentHash,
        Priority priority,
        uint256 timestamp
    );

    event ComplaintStatusChanged(
        bytes32 indexed id,
        GrievanceStatus previousStatus,
        GrievanceStatus newStatus,
        bytes32 actionHash,
        uint256 timestamp
    );

    event ComplaintTransferred(
        bytes32 indexed id,
        bytes32 previousDeptHash,
        bytes32 newDeptHash,
        bytes32 actionHash,
        uint256 timestamp
    );

    event OfficerActionRecorded(
        bytes32 indexed id,
        bytes32 actionHash,
        string actionType,
        uint256 timestamp
    );

    event ComplaintResolved(
        bytes32 indexed id,
        bytes32 indexed resolutionHash,
        bytes32 actionHash,
        uint256 timestamp
    );

    error ComplaintAlreadyRegistered(bytes32 id);
    error ComplaintDoesNotExist(bytes32 id);
    error ComplaintAlreadyResolved(bytes32 id);
    error ComplaintAlreadyTerminal(bytes32 id);
    error InvalidComplaintId();
    error InvalidHash();
    error InvalidStatusTransition(GrievanceStatus currentStatus, GrievanceStatus attemptedStatus);
    error ZeroDepartmentHash();
    error IdenticalDepartment();
    error CannotTransferResolvedComplaint(bytes32 id);
    error ActionTypeTooLong();

    constructor(address initialAdmin, address initialRelayer) {
        require(initialAdmin != address(0), "Admin cannot be zero address");
        require(initialRelayer != address(0), "Relayer cannot be zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(AUDITOR_ROLE, initialAdmin);
        _grantRole(BACKEND_ROLE, initialRelayer);
        _grantRole(AUDITOR_ROLE, initialRelayer);
    }

    /**
     * @notice Registers a new complaint on-chain with its cryptographic fingerprint.
     * @param id The unique bytes32 identifier of the complaint.
     * @param complaintHash Deterministic keccak256 hash of the canonical complaint payload.
     * @param departmentHash Hash of the assigned municipal department.
     * @param priority Initial priority level assigned by triage engine.
     */
    function registerComplaint(
        bytes32 id,
        bytes32 complaintHash,
        bytes32 departmentHash,
        Priority priority
    ) external onlyRole(BACKEND_ROLE) whenNotPaused nonReentrant {
        if (id == bytes32(0)) revert InvalidComplaintId();
        if (complaintHash == bytes32(0)) revert InvalidHash();
        if (departmentHash == bytes32(0)) revert ZeroDepartmentHash();
        if (_complaints[id].exists) revert ComplaintAlreadyRegistered(id);

        ComplaintRecord storage record = _complaints[id];
        record.complaintHash = complaintHash;
        record.departmentHash = departmentHash;
        record.priority = priority;
        record.status = GrievanceStatus.Open;
        record.latestActionHash = complaintHash;
        record.resolutionHash = bytes32(0);
        record.registeredAt = uint64(block.timestamp);
        record.updatedAt = uint64(block.timestamp);
        record.actionCount = 1;
        record.exists = true;

        totalComplaints++;

        _auditHistory[id].push(
            ActionEventRecord({
                actionHash: complaintHash,
                status: GrievanceStatus.Open,
                departmentHash: departmentHash,
                timestamp: block.timestamp,
                actionType: "REGISTERED"
            })
        );

        emit ComplaintRegistered(
            id,
            complaintHash,
            departmentHash,
            priority,
            block.timestamp
        );
    }

    /**
     * @notice Updates the operational status of a complaint adhering to strict FSM lifecycle rules.
     * @param id The unique bytes32 identifier of the complaint.
     * @param newStatus The new status to transition to.
     * @param actionHash Cryptographic hash representing the action/decision note.
     */
    function updateStatus(
        bytes32 id,
        GrievanceStatus newStatus,
        bytes32 actionHash
    ) external onlyRole(BACKEND_ROLE) whenNotPaused nonReentrant {
        if (!_complaints[id].exists) revert ComplaintDoesNotExist(id);
        if (actionHash == bytes32(0)) revert InvalidHash();

        ComplaintRecord storage record = _complaints[id];
        GrievanceStatus previousStatus = record.status;

        // Terminal state check: Closed complaints are immutable
        if (previousStatus == GrievanceStatus.Closed) {
            revert ComplaintAlreadyTerminal(id);
        }

        // Prohibit transition to None or identical self-transitions
        if (newStatus == GrievanceStatus.None || newStatus == previousStatus) {
            revert InvalidStatusTransition(previousStatus, newStatus);
        }

        // Strict FSM state validation
        if (previousStatus == GrievanceStatus.Resolved) {
            // Once Resolved, can ONLY transition forward to Closed
            if (newStatus != GrievanceStatus.Closed) {
                revert InvalidStatusTransition(previousStatus, newStatus);
            }
        } else if (previousStatus == GrievanceStatus.Open) {
            // Open can transition to InProgress, Transferred, Resolved, or Closed
            if (
                newStatus != GrievanceStatus.InProgress &&
                newStatus != GrievanceStatus.Transferred &&
                newStatus != GrievanceStatus.Resolved &&
                newStatus != GrievanceStatus.Closed
            ) {
                revert InvalidStatusTransition(previousStatus, newStatus);
            }
        } else if (previousStatus == GrievanceStatus.InProgress) {
            // InProgress can transition to Transferred, Resolved, or Closed. Cannot regress to Open
            if (
                newStatus != GrievanceStatus.Transferred &&
                newStatus != GrievanceStatus.Resolved &&
                newStatus != GrievanceStatus.Closed
            ) {
                revert InvalidStatusTransition(previousStatus, newStatus);
            }
        } else if (previousStatus == GrievanceStatus.Transferred) {
            // Transferred can transition to InProgress, Resolved, or Closed. Cannot regress to Open
            if (
                newStatus != GrievanceStatus.InProgress &&
                newStatus != GrievanceStatus.Resolved &&
                newStatus != GrievanceStatus.Closed
            ) {
                revert InvalidStatusTransition(previousStatus, newStatus);
            }
        }

        record.status = newStatus;
        record.latestActionHash = actionHash;
        record.updatedAt = uint64(block.timestamp);
        record.actionCount++;

        _auditHistory[id].push(
            ActionEventRecord({
                actionHash: actionHash,
                status: newStatus,
                departmentHash: record.departmentHash,
                timestamp: block.timestamp,
                actionType: "STATUS_UPDATE"
            })
        );

        emit ComplaintStatusChanged(
            id,
            previousStatus,
            newStatus,
            actionHash,
            block.timestamp
        );
    }

    /**
     * @notice Transfers a complaint to a different municipal department.
     * @param id The unique bytes32 identifier of the complaint.
     * @param newDeptHash Hash of the new destination department.
     * @param actionHash Cryptographic hash representing the transfer rationale.
     */
    function transferDepartment(
        bytes32 id,
        bytes32 newDeptHash,
        bytes32 actionHash
    ) external onlyRole(BACKEND_ROLE) whenNotPaused nonReentrant {
        if (!_complaints[id].exists) revert ComplaintDoesNotExist(id);
        if (actionHash == bytes32(0)) revert InvalidHash();
        if (newDeptHash == bytes32(0)) revert ZeroDepartmentHash();

        ComplaintRecord storage record = _complaints[id];
        if (record.status == GrievanceStatus.Closed) revert ComplaintAlreadyTerminal(id);
        if (record.status == GrievanceStatus.Resolved) revert CannotTransferResolvedComplaint(id);
        if (record.departmentHash == newDeptHash) revert IdenticalDepartment();

        bytes32 previousDept = record.departmentHash;
        record.departmentHash = newDeptHash;
        record.status = GrievanceStatus.Transferred;
        record.latestActionHash = actionHash;
        record.updatedAt = uint64(block.timestamp);
        record.actionCount++;

        _auditHistory[id].push(
            ActionEventRecord({
                actionHash: actionHash,
                status: GrievanceStatus.Transferred,
                departmentHash: newDeptHash,
                timestamp: block.timestamp,
                actionType: "TRANSFER"
            })
        );

        emit ComplaintTransferred(
            id,
            previousDept,
            newDeptHash,
            actionHash,
            block.timestamp
        );
    }

    /**
     * @notice Records an official officer action or formal municipal reply.
     * @param id The unique bytes32 identifier of the complaint.
     * @param actionHash Cryptographic hash of the officer reply payload.
     * @param actionType Human-readable type (max 64 bytes).
     */
    function recordOfficerAction(
        bytes32 id,
        bytes32 actionHash,
        string calldata actionType
    ) external onlyRole(BACKEND_ROLE) whenNotPaused nonReentrant {
        if (!_complaints[id].exists) revert ComplaintDoesNotExist(id);
        if (actionHash == bytes32(0)) revert InvalidHash();
        if (bytes(actionType).length > 64) revert ActionTypeTooLong();

        ComplaintRecord storage record = _complaints[id];
        if (record.status == GrievanceStatus.Closed) revert ComplaintAlreadyTerminal(id);

        record.latestActionHash = actionHash;
        record.updatedAt = uint64(block.timestamp);
        record.actionCount++;

        _auditHistory[id].push(
            ActionEventRecord({
                actionHash: actionHash,
                status: record.status,
                departmentHash: record.departmentHash,
                timestamp: block.timestamp,
                actionType: actionType
            })
        );

        emit OfficerActionRecorded(
            id,
            actionHash,
            actionType,
            block.timestamp
        );
    }

    /**
     * @notice Formally certifies and locks the resolution proof of a grievance on-chain.
     * @param id The unique bytes32 identifier of the complaint.
     * @param resolutionHash Cryptographic hash of resolution note, materials, and ground photo proof.
     * @param actionHash Audit hash of the resolution transaction context.
     */
    function recordResolution(
        bytes32 id,
        bytes32 resolutionHash,
        bytes32 actionHash
    ) external onlyRole(BACKEND_ROLE) whenNotPaused nonReentrant {
        if (!_complaints[id].exists) revert ComplaintDoesNotExist(id);
        if (resolutionHash == bytes32(0)) revert InvalidHash();
        if (actionHash == bytes32(0)) revert InvalidHash();

        ComplaintRecord storage record = _complaints[id];
        if (record.status == GrievanceStatus.Closed) revert ComplaintAlreadyTerminal(id);
        if (record.resolutionHash != bytes32(0) || record.status == GrievanceStatus.Resolved) {
            revert ComplaintAlreadyResolved(id);
        }

        record.status = GrievanceStatus.Resolved;
        record.resolutionHash = resolutionHash;
        record.latestActionHash = actionHash;
        record.updatedAt = uint64(block.timestamp);
        record.actionCount++;

        _auditHistory[id].push(
            ActionEventRecord({
                actionHash: actionHash,
                status: GrievanceStatus.Resolved,
                departmentHash: record.departmentHash,
                timestamp: block.timestamp,
                actionType: "RESOLUTION"
            })
        );

        emit ComplaintResolved(
            id,
            resolutionHash,
            actionHash,
            block.timestamp
        );
    }

    /**
     * @notice Verifies if a candidate complaint hash matches the immutable on-chain record.
     * @param id The unique bytes32 identifier of the complaint.
     * @param candidateHash The recalculated hash of current off-chain complaint data.
     * @return isValid True if the complaint exists and the hash matches exactly; false otherwise.
     */
    function verifyComplaint(
        bytes32 id,
        bytes32 candidateHash
    ) external view returns (bool isValid) {
        if (!_complaints[id].exists) return false;
        return _complaints[id].complaintHash == candidateHash;
    }

    /**
     * @notice Verifies if a candidate resolution hash matches the immutable on-chain record.
     * @param id The unique bytes32 identifier of the complaint.
     * @param candidateResolutionHash The recalculated hash of off-chain resolution data & photo.
     * @return isValid True if resolution exists and matches; false otherwise.
     */
    function verifyResolution(
        bytes32 id,
        bytes32 candidateResolutionHash
    ) external view returns (bool isValid) {
        if (!_complaints[id].exists) return false;
        if (_complaints[id].resolutionHash == bytes32(0)) return false;
        return _complaints[id].resolutionHash == candidateResolutionHash;
    }

    /**
     * @notice Returns the full complaint audit record.
     * @param id The unique bytes32 identifier of the complaint.
     */
    function getComplaint(
        bytes32 id
    ) external view returns (ComplaintRecord memory) {
        if (!_complaints[id].exists) revert ComplaintDoesNotExist(id);
        return _complaints[id];
    }

    /**
     * @notice Returns the full immutable event audit history of a complaint.
     * @param id The unique bytes32 identifier of the complaint.
     */
    function getAuditHistory(
        bytes32 id
    ) external view returns (ActionEventRecord[] memory) {
        if (!_complaints[id].exists) revert ComplaintDoesNotExist(id);
        return _auditHistory[id];
    }

    /**
     * @notice Returns a paginated slice of the audit history to prevent gas/memory exhaustion.
     * @param id The unique bytes32 identifier of the complaint.
     * @param offset Starting index of history records.
     * @param limit Maximum number of records to return.
     */
    function getAuditHistoryPaginated(
        bytes32 id,
        uint256 offset,
        uint256 limit
    ) external view returns (ActionEventRecord[] memory records, uint256 total) {
        if (!_complaints[id].exists) revert ComplaintDoesNotExist(id);
        uint256 historyLen = _auditHistory[id].length;
        if (offset >= historyLen || limit == 0) {
            return (new ActionEventRecord[](0), historyLen);
        }

        uint256 end = offset + limit;
        if (end > historyLen) {
            end = historyLen;
        }
        uint256 resultSize = end - offset;
        records = new ActionEventRecord[](resultSize);
        for (uint256 i = 0; i < resultSize; i++) {
            records[i] = _auditHistory[id][offset + i];
        }
        return (records, historyLen);
    }

    /**
     * @notice Pauses contract operations in case of emergency.
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses contract operations.
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
