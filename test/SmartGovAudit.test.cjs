const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SmartGovAudit Smart Contract Suite", function () {
  let smartGovAudit;
  let admin;
  let backend;
  let officer;
  let citizen;
  let unauthorizedUser;

  const BACKEND_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BACKEND_ROLE"));
  const AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AUDITOR_ROLE"));

  // Sample test data
  const sampleComplaintId = ethers.keccak256(ethers.toUtf8Bytes("GRV-2023-1042"));
  const sampleComplaintHash = ethers.keccak256(
    ethers.toUtf8Bytes(
      JSON.stringify({
        id: "GRV-2023-1042",
        description: "Street light failure near Central Market",
        department: "Public Works (Power)",
        priority: "High",
        lat: 28.6139,
        lng: 77.209,
      })
    )
  );
  const sampleDeptPower = ethers.keccak256(ethers.toUtf8Bytes("Public Works (Power)"));
  const sampleDeptWater = ethers.keccak256(ethers.toUtf8Bytes("Water Board"));
  const sampleResolutionHash = ethers.keccak256(
    ethers.toUtf8Bytes(
      JSON.stringify({
        notes: "45W LED fixture installed and verified on-ground",
        officer: "Officer Jane Smith",
        photoSha256: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      })
    )
  );

  beforeEach(async function () {
    [admin, backend, officer, citizen, unauthorizedUser] = await ethers.getSigners();

    const SmartGovAuditFactory = await ethers.getContractFactory("SmartGovAudit");
    smartGovAudit = await SmartGovAuditFactory.deploy(admin.address, backend.address);
    await smartGovAudit.waitForDeployment();
  });

  describe("1. Deployment & Access Control Initialization", function () {
    it("should assign DEFAULT_ADMIN_ROLE and AUDITOR_ROLE to admin, but NOT BACKEND_ROLE", async function () {
      const defaultAdminRole = await smartGovAudit.DEFAULT_ADMIN_ROLE();
      expect(await smartGovAudit.hasRole(defaultAdminRole, admin.address)).to.be.true;
      expect(await smartGovAudit.hasRole(AUDITOR_ROLE, admin.address)).to.be.true;
      expect(await smartGovAudit.hasRole(BACKEND_ROLE, admin.address)).to.be.false;
    });

    it("should assign BACKEND_ROLE and AUDITOR_ROLE to relayer, but NOT DEFAULT_ADMIN_ROLE", async function () {
      const defaultAdminRole = await smartGovAudit.DEFAULT_ADMIN_ROLE();
      expect(await smartGovAudit.hasRole(BACKEND_ROLE, backend.address)).to.be.true;
      expect(await smartGovAudit.hasRole(AUDITOR_ROLE, backend.address)).to.be.true;
      expect(await smartGovAudit.hasRole(defaultAdminRole, backend.address)).to.be.false;
    });

    it("should allow admin to grant and revoke BACKEND_ROLE", async function () {
      expect(await smartGovAudit.hasRole(BACKEND_ROLE, officer.address)).to.be.false;
      await smartGovAudit.connect(admin).grantRole(BACKEND_ROLE, officer.address);
      expect(await smartGovAudit.hasRole(BACKEND_ROLE, officer.address)).to.be.true;
      await smartGovAudit.connect(admin).revokeRole(BACKEND_ROLE, officer.address);
      expect(await smartGovAudit.hasRole(BACKEND_ROLE, officer.address)).to.be.false;
    });

    it("should revert deployment with zero address admin", async function () {
      const SmartGovAuditFactory = await ethers.getContractFactory("SmartGovAudit");
      await expect(
        SmartGovAuditFactory.deploy(ethers.ZeroAddress, backend.address)
      ).to.be.revertedWith("Admin cannot be zero address");
    });

    it("should revert deployment with zero address relayer", async function () {
      const SmartGovAuditFactory = await ethers.getContractFactory("SmartGovAudit");
      await expect(
        SmartGovAuditFactory.deploy(admin.address, ethers.ZeroAddress)
      ).to.be.revertedWith("Relayer cannot be zero address");
    });

    it("should reject relayer attempting to call pause()", async function () {
      await expect(
        smartGovAudit.connect(backend).pause()
      ).to.be.revertedWithCustomError(smartGovAudit, "AccessControlUnauthorizedAccount");
    });
  });

  describe("2. Complaint Registration", function () {
    it("should successfully register a new grievance from relayer and emit ComplaintRegistered", async function () {
      // Priority 3 = High
      await expect(
        smartGovAudit
          .connect(backend)
          .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3)
      )
        .to.emit(smartGovAudit, "ComplaintRegistered")
        .withArgs(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3, (ts) => ts > 0);

      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.exists).to.be.true;
      expect(record.complaintHash).to.equal(sampleComplaintHash);
      expect(record.departmentHash).to.equal(sampleDeptPower);
      expect(record.priority).to.equal(3n);
      expect(record.status).to.equal(1n); // GrievanceStatus.Open
      expect(record.actionCount).to.equal(1n);

      expect(await smartGovAudit.totalComplaints()).to.equal(1n);
    });

    it("should reject registration from admin if admin lacks BACKEND_ROLE", async function () {
      await expect(
        smartGovAudit
          .connect(admin)
          .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3)
      ).to.be.revertedWithCustomError(smartGovAudit, "AccessControlUnauthorizedAccount");
    });

    it("should reject duplicate registration of the same complaint ID", async function () {
      await smartGovAudit
        .connect(backend)
        .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3);

      await expect(
        smartGovAudit
          .connect(backend)
          .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3)
      )
        .to.be.revertedWithCustomError(smartGovAudit, "ComplaintAlreadyRegistered")
        .withArgs(sampleComplaintId);
    });

    it("should revert registration with zero complaint ID", async function () {
      await expect(
        smartGovAudit
          .connect(backend)
          .registerComplaint(ethers.ZeroHash, sampleComplaintHash, sampleDeptPower, 3)
      ).to.be.revertedWithCustomError(smartGovAudit, "InvalidComplaintId");
    });

    it("should revert registration with zero complaint hash", async function () {
      await expect(
        smartGovAudit
          .connect(backend)
          .registerComplaint(sampleComplaintId, ethers.ZeroHash, sampleDeptPower, 3)
      ).to.be.revertedWithCustomError(smartGovAudit, "InvalidHash");
    });

    it("should revert registration with zero department hash", async function () {
      await expect(
        smartGovAudit
          .connect(backend)
          .registerComplaint(sampleComplaintId, sampleComplaintHash, ethers.ZeroHash, 3)
      ).to.be.revertedWithCustomError(smartGovAudit, "ZeroDepartmentHash");
    });

    it("should reject registration from unauthorized non-backend account", async function () {
      await expect(
        smartGovAudit
          .connect(unauthorizedUser)
          .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3)
      ).to.be.revertedWithCustomError(smartGovAudit, "AccessControlUnauthorizedAccount");
    });
  });

  describe("3. Status Lifecycle Transitions & Strict State Machine", function () {
    beforeEach(async function () {
      await smartGovAudit
        .connect(backend)
        .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3);
    });

    it("should transition status from Open to InProgress with action hash", async function () {
      const actionHash = ethers.keccak256(ethers.toUtf8Bytes("Assigned to Zonal Engineer Anita"));

      // GrievanceStatus.InProgress = 2
      await expect(smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 2, actionHash))
        .to.emit(smartGovAudit, "ComplaintStatusChanged")
        .withArgs(sampleComplaintId, 1, 2, actionHash, (ts) => ts > 0);

      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.status).to.equal(2n);
      expect(record.latestActionHash).to.equal(actionHash);
      expect(record.actionCount).to.equal(2n);
    });

    it("should transition status from Open to Transferred", async function () {
      const actionHash = ethers.keccak256(ethers.toUtf8Bytes("Reassigned to new department"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 3, actionHash);

      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.status).to.equal(3n); // Transferred
    });

    it("should transition status from Open directly to Closed", async function () {
      const actionHash = ethers.keccak256(ethers.toUtf8Bytes("Dismissed as duplicate"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 5, actionHash);

      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.status).to.equal(5n); // Closed
    });

    it("should transition status from InProgress to Closed", async function () {
      const progressHash = ethers.keccak256(ethers.toUtf8Bytes("Work in progress"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 2, progressHash);

      const closeHash = ethers.keccak256(ethers.toUtf8Bytes("Closed after field verification"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 5, closeHash);

      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.status).to.equal(5n);
    });

    it("should transition status from Transferred to InProgress", async function () {
      const transferHash = ethers.keccak256(ethers.toUtf8Bytes("Transfer reason"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 3, transferHash);

      const progressHash = ethers.keccak256(ethers.toUtf8Bytes("New department started work"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 2, progressHash);

      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.status).to.equal(2n);
    });

    it("should reject status update for non-existent complaint", async function () {
      const nonExistentId = ethers.keccak256(ethers.toUtf8Bytes("NON-EXISTENT"));
      const actionHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await expect(
        smartGovAudit.connect(backend).updateStatus(nonExistentId, 2, actionHash)
      )
        .to.be.revertedWithCustomError(smartGovAudit, "ComplaintDoesNotExist")
        .withArgs(nonExistentId);
    });

    it("should reject status update with zero action hash", async function () {
      await expect(
        smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 2, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(smartGovAudit, "InvalidHash");
    });

    it("should reject status transition to GrievanceStatus.None", async function () {
      const actionHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await expect(
        smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 0, actionHash)
      ).to.be.revertedWithCustomError(smartGovAudit, "InvalidStatusTransition")
        .withArgs(1, 0);
    });

    it("should reject identical self-transition (Open to Open)", async function () {
      const actionHash = ethers.keccak256(ethers.toUtf8Bytes("no-op update"));
      await expect(
        smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 1, actionHash)
      ).to.be.revertedWithCustomError(smartGovAudit, "InvalidStatusTransition")
        .withArgs(1, 1);
    });

    it("should reject invalid regression from InProgress back to Open", async function () {
      const actionHash1 = ethers.keccak256(ethers.toUtf8Bytes("In progress"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 2, actionHash1);

      const actionHash2 = ethers.keccak256(ethers.toUtf8Bytes("Regression attempt"));
      await expect(
        smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 1, actionHash2)
      ).to.be.revertedWithCustomError(smartGovAudit, "InvalidStatusTransition")
        .withArgs(2, 1);
    });

    it("should reject invalid regression from Transferred back to Open", async function () {
      const actionHash1 = ethers.keccak256(ethers.toUtf8Bytes("Transferred"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 3, actionHash1);

      const actionHash2 = ethers.keccak256(ethers.toUtf8Bytes("Regression attempt"));
      await expect(
        smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 1, actionHash2)
      ).to.be.revertedWithCustomError(smartGovAudit, "InvalidStatusTransition")
        .withArgs(3, 1);
    });

    it("should reject invalid regression from Resolved back to Open or InProgress", async function () {
      const resolveHash = ethers.keccak256(ethers.toUtf8Bytes("Resolution note"));
      await smartGovAudit.connect(backend).recordResolution(sampleComplaintId, sampleResolutionHash, resolveHash);

      const regressToOpen = ethers.keccak256(ethers.toUtf8Bytes("Regress to Open"));
      await expect(
        smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 1, regressToOpen)
      ).to.be.revertedWithCustomError(smartGovAudit, "InvalidStatusTransition")
        .withArgs(4, 1);

      const regressToProgress = ethers.keccak256(ethers.toUtf8Bytes("Regress to InProgress"));
      await expect(
        smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 2, regressToProgress)
      ).to.be.revertedWithCustomError(smartGovAudit, "InvalidStatusTransition")
        .withArgs(4, 2);
    });
  });

  describe("4. Department Transfers", function () {
    beforeEach(async function () {
      await smartGovAudit
        .connect(backend)
        .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3);
    });

    it("should transfer complaint to a new department and emit ComplaintTransferred", async function () {
      const transferActionHash = ethers.keccak256(
        ethers.toUtf8Bytes("Transfer to Water Board: leak found near cable trench")
      );

      await expect(
        smartGovAudit
          .connect(backend)
          .transferDepartment(sampleComplaintId, sampleDeptWater, transferActionHash)
      )
        .to.emit(smartGovAudit, "ComplaintTransferred")
        .withArgs(
          sampleComplaintId,
          sampleDeptPower,
          sampleDeptWater,
          transferActionHash,
          (ts) => ts > 0
        );

      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.departmentHash).to.equal(sampleDeptWater);
      expect(record.status).to.equal(3n); // GrievanceStatus.Transferred
    });

    it("should allow transfer from InProgress and set status to Transferred", async function () {
      const progressHash = ethers.keccak256(ethers.toUtf8Bytes("Started work"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 2, progressHash);

      const transferActionHash = ethers.keccak256(ethers.toUtf8Bytes("Transfer to Water"));
      await smartGovAudit.connect(backend).transferDepartment(sampleComplaintId, sampleDeptWater, transferActionHash);

      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.departmentHash).to.equal(sampleDeptWater);
      expect(record.status).to.equal(3n);
    });

    it("should reject transfer to the identical department", async function () {
      const transferActionHash = ethers.keccak256(ethers.toUtf8Bytes("no-op transfer"));
      await expect(
        smartGovAudit
          .connect(backend)
          .transferDepartment(sampleComplaintId, sampleDeptPower, transferActionHash)
      ).to.be.revertedWithCustomError(smartGovAudit, "IdenticalDepartment");
    });

    it("should reject transfer with zero department hash", async function () {
      const transferActionHash = ethers.keccak256(ethers.toUtf8Bytes("transfer"));
      await expect(
        smartGovAudit
          .connect(backend)
          .transferDepartment(sampleComplaintId, ethers.ZeroHash, transferActionHash)
      ).to.be.revertedWithCustomError(smartGovAudit, "ZeroDepartmentHash");
    });

    it("should reject transfer on a Resolved complaint", async function () {
      const resAction = ethers.keccak256(ethers.toUtf8Bytes("Resolution"));
      await smartGovAudit.connect(backend).recordResolution(sampleComplaintId, sampleResolutionHash, resAction);

      const transferAction = ethers.keccak256(ethers.toUtf8Bytes("Late transfer"));
      await expect(
        smartGovAudit.connect(backend).transferDepartment(sampleComplaintId, sampleDeptWater, transferAction)
      ).to.be.revertedWithCustomError(smartGovAudit, "CannotTransferResolvedComplaint")
        .withArgs(sampleComplaintId);
    });

    it("should reject transfer on a Closed complaint", async function () {
      const closeAction = ethers.keccak256(ethers.toUtf8Bytes("Closed"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 5, closeAction);

      const transferAction = ethers.keccak256(ethers.toUtf8Bytes("Transfer attempt"));
      await expect(
        smartGovAudit.connect(backend).transferDepartment(sampleComplaintId, sampleDeptWater, transferAction)
      ).to.be.revertedWithCustomError(smartGovAudit, "ComplaintAlreadyTerminal")
        .withArgs(sampleComplaintId);
    });
  });

  describe("5. Officer Action & Reply Recording", function () {
    beforeEach(async function () {
      await smartGovAudit
        .connect(backend)
        .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3);
    });

    it("should record officer reply action and emit OfficerActionRecorded", async function () {
      const replyActionHash = ethers.keccak256(
        ethers.toUtf8Bytes("Official reply by Er. Sharma: Power repair crew en route")
      );

      await expect(
        smartGovAudit
          .connect(backend)
          .recordOfficerAction(sampleComplaintId, replyActionHash, "OFFICIAL_REPLY")
      )
        .to.emit(smartGovAudit, "OfficerActionRecorded")
        .withArgs(sampleComplaintId, replyActionHash, "OFFICIAL_REPLY", (ts) => ts > 0);

      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.latestActionHash).to.equal(replyActionHash);
      expect(record.actionCount).to.equal(2n);
    });

    it("should reject officer action with actionType exceeding 64 bytes", async function () {
      const actionHash = ethers.keccak256(ethers.toUtf8Bytes("action"));
      const longType = "A".repeat(65);

      await expect(
        smartGovAudit.connect(backend).recordOfficerAction(sampleComplaintId, actionHash, longType)
      ).to.be.revertedWithCustomError(smartGovAudit, "ActionTypeTooLong");
    });

    it("should reject officer action on a Closed complaint", async function () {
      const closeHash = ethers.keccak256(ethers.toUtf8Bytes("Close"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 5, closeHash);

      const actionHash = ethers.keccak256(ethers.toUtf8Bytes("After close action"));
      await expect(
        smartGovAudit.connect(backend).recordOfficerAction(sampleComplaintId, actionHash, "NOTE")
      ).to.be.revertedWithCustomError(smartGovAudit, "ComplaintAlreadyTerminal")
        .withArgs(sampleComplaintId);
    });
  });

  describe("6. Resolution Proof Certification & Locking", function () {
    beforeEach(async function () {
      await smartGovAudit
        .connect(backend)
        .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3);
    });

    it("should lock resolution proof on-chain and transition status to Resolved", async function () {
      const actionHash = ethers.keccak256(ethers.toUtf8Bytes("Field inspection passed with photo proof"));

      await expect(
        smartGovAudit
          .connect(backend)
          .recordResolution(sampleComplaintId, sampleResolutionHash, actionHash)
      )
        .to.emit(smartGovAudit, "ComplaintResolved")
        .withArgs(sampleComplaintId, sampleResolutionHash, actionHash, (ts) => ts > 0);

      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.status).to.equal(4n); // GrievanceStatus.Resolved
      expect(record.resolutionHash).to.equal(sampleResolutionHash);

      // Verify on-chain verification method
      expect(
        await smartGovAudit.verifyResolution(sampleComplaintId, sampleResolutionHash)
      ).to.be.true;

      // Tampered resolution hash check
      const fakeResolutionHash = ethers.keccak256(ethers.toUtf8Bytes("FAKE_RESOLUTION"));
      expect(
        await smartGovAudit.verifyResolution(sampleComplaintId, fakeResolutionHash)
      ).to.be.false;
    });

    it("should allow transition from Resolved to Closed", async function () {
      const resAction = ethers.keccak256(ethers.toUtf8Bytes("Resolved"));
      await smartGovAudit.connect(backend).recordResolution(sampleComplaintId, sampleResolutionHash, resAction);

      const closeAction = ethers.keccak256(ethers.toUtf8Bytes("Citizen satisfied, closing ticket"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 5, closeAction);

      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.status).to.equal(5n); // Closed
    });

    it("should reject double resolution of an already resolved complaint", async function () {
      const actionHash = ethers.keccak256(ethers.toUtf8Bytes("Resolved first time"));
      await smartGovAudit
        .connect(backend)
        .recordResolution(sampleComplaintId, sampleResolutionHash, actionHash);

      await expect(
        smartGovAudit
          .connect(backend)
          .recordResolution(sampleComplaintId, sampleResolutionHash, actionHash)
      )
        .to.be.revertedWithCustomError(smartGovAudit, "ComplaintAlreadyResolved")
        .withArgs(sampleComplaintId);
    });

    it("should reject recordResolution on a Closed complaint", async function () {
      const closeAction = ethers.keccak256(ethers.toUtf8Bytes("Directly closed"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 5, closeAction);

      const resAction = ethers.keccak256(ethers.toUtf8Bytes("Late resolution attempt"));
      await expect(
        smartGovAudit.connect(backend).recordResolution(sampleComplaintId, sampleResolutionHash, resAction)
      ).to.be.revertedWithCustomError(smartGovAudit, "ComplaintAlreadyTerminal")
        .withArgs(sampleComplaintId);
    });
  });

  describe("7. Terminal Closed State Enforcement", function () {
    beforeEach(async function () {
      await smartGovAudit
        .connect(backend)
        .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3);

      const closeAction = ethers.keccak256(ethers.toUtf8Bytes("Closed"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 5, closeAction);
    });

    it("should confirm complaint status is Closed", async function () {
      const record = await smartGovAudit.getComplaint(sampleComplaintId);
      expect(record.status).to.equal(5n); // Closed
    });

    it("should reject updateStatus on a Closed complaint with ComplaintAlreadyTerminal", async function () {
      const reopenAction = ethers.keccak256(ethers.toUtf8Bytes("Attempt reopen"));
      await expect(
        smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 1, reopenAction)
      ).to.be.revertedWithCustomError(smartGovAudit, "ComplaintAlreadyTerminal")
        .withArgs(sampleComplaintId);
    });

    it("should reject transferDepartment on a Closed complaint with ComplaintAlreadyTerminal", async function () {
      const transferAction = ethers.keccak256(ethers.toUtf8Bytes("Attempt transfer"));
      await expect(
        smartGovAudit.connect(backend).transferDepartment(sampleComplaintId, sampleDeptWater, transferAction)
      ).to.be.revertedWithCustomError(smartGovAudit, "ComplaintAlreadyTerminal")
        .withArgs(sampleComplaintId);
    });
  });

  describe("8. Cryptographic Verification & Tamper Detection", function () {
    beforeEach(async function () {
      await smartGovAudit
        .connect(backend)
        .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3);
    });

    it("should return true when off-chain hash matches the on-chain record", async function () {
      const isValid = await smartGovAudit.verifyComplaint(sampleComplaintId, sampleComplaintHash);
      expect(isValid).to.be.true;
    });

    it("should return false when candidate hash is tampered/different", async function () {
      const tamperedHash = ethers.keccak256(
        ethers.toUtf8Bytes("Tampered grievance description by attacker")
      );
      const isValid = await smartGovAudit.verifyComplaint(sampleComplaintId, tamperedHash);
      expect(isValid).to.be.false;
    });

    it("should return false for non-existent complaint verification", async function () {
      const ghostId = ethers.keccak256(ethers.toUtf8Bytes("GHOST-123"));
      const isValid = await smartGovAudit.verifyComplaint(ghostId, sampleComplaintHash);
      expect(isValid).to.be.false;
    });
  });

  describe("9. Audit Trail History Querying & Pagination", function () {
    it("should record complete sequence of lifecycle events in audit history", async function () {
      await smartGovAudit
        .connect(backend)
        .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3);

      const statusAction = ethers.keccak256(ethers.toUtf8Bytes("In Progress action"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 2, statusAction);

      const replyAction = ethers.keccak256(ethers.toUtf8Bytes("Reply action"));
      await smartGovAudit
        .connect(backend)
        .recordOfficerAction(sampleComplaintId, replyAction, "OFFICIAL_REPLY");

      const resAction = ethers.keccak256(ethers.toUtf8Bytes("Resolution action"));
      await smartGovAudit
        .connect(backend)
        .recordResolution(sampleComplaintId, sampleResolutionHash, resAction);

      const history = await smartGovAudit.getAuditHistory(sampleComplaintId);
      expect(history.length).to.equal(4);
      expect(history[0].actionType).to.equal("REGISTERED");
      expect(history[1].actionType).to.equal("STATUS_UPDATE");
      expect(history[2].actionType).to.equal("OFFICIAL_REPLY");
      expect(history[3].actionType).to.equal("RESOLUTION");
    });

    it("should return paginated audit history correctly with getAuditHistoryPaginated", async function () {
      await smartGovAudit
        .connect(backend)
        .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3);

      const statusAction = ethers.keccak256(ethers.toUtf8Bytes("In Progress action"));
      await smartGovAudit.connect(backend).updateStatus(sampleComplaintId, 2, statusAction);

      const replyAction = ethers.keccak256(ethers.toUtf8Bytes("Reply action"));
      await smartGovAudit
        .connect(backend)
        .recordOfficerAction(sampleComplaintId, replyAction, "OFFICIAL_REPLY");

      // Request first 2 records (offset 0, limit 2)
      const page1 = await smartGovAudit.getAuditHistoryPaginated(sampleComplaintId, 0, 2);
      expect(page1.records.length).to.equal(2);
      expect(page1.total).to.equal(3n);
      expect(page1.records[0].actionType).to.equal("REGISTERED");
      expect(page1.records[1].actionType).to.equal("STATUS_UPDATE");

      // Request next 2 records (offset 2, limit 2)
      const page2 = await smartGovAudit.getAuditHistoryPaginated(sampleComplaintId, 2, 2);
      expect(page2.records.length).to.equal(1);
      expect(page2.records[0].actionType).to.equal("OFFICIAL_REPLY");
    });

    it("should handle pagination when offset exceeds total events", async function () {
      await smartGovAudit
        .connect(backend)
        .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3);

      const emptyPage = await smartGovAudit.getAuditHistoryPaginated(sampleComplaintId, 10, 5);
      expect(emptyPage.records.length).to.equal(0);
      expect(emptyPage.total).to.equal(1n);
    });
  });

  describe("10. Emergency Pausable Stop", function () {
    it("should pause contract by admin and reject registrations when paused", async function () {
      await smartGovAudit.connect(admin).pause();

      await expect(
        smartGovAudit
          .connect(backend)
          .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3)
      ).to.be.revertedWithCustomError(smartGovAudit, "EnforcedPause");

      await smartGovAudit.connect(admin).unpause();

      await expect(
        smartGovAudit
          .connect(backend)
          .registerComplaint(sampleComplaintId, sampleComplaintHash, sampleDeptPower, 3)
      ).to.emit(smartGovAudit, "ComplaintRegistered");
    });

    it("should reject non-admin (including relayer) calling pause", async function () {
      await expect(
        smartGovAudit.connect(unauthorizedUser).pause()
      ).to.be.revertedWithCustomError(smartGovAudit, "AccessControlUnauthorizedAccount");

      await expect(
        smartGovAudit.connect(backend).pause()
      ).to.be.revertedWithCustomError(smartGovAudit, "AccessControlUnauthorizedAccount");
    });
  });
});
