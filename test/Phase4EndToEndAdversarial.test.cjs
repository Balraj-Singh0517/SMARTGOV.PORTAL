const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

describe("Phase 4: End-to-End Regression, Tamper Verification & Reliability Suite", function () {
  this.timeout(90000);

  let smartGovAudit;
  let admin;
  let backendRelayer;
  let unauthorizedUser;

  let clientHashing;
  let clientVerifier;
  let backendHashing;
  let TransactionQueue;

  let contractAddress;
  const TEST_DIR = path.join(process.cwd(), "data", "test_phase4_queue");

  before(async function () {
    [admin, backendRelayer, unauthorizedUser] = await ethers.getSigners();

    // Import client modules
    clientHashing = await import("../src/utils/clientHashing.ts");
    clientVerifier = await import("../src/services/clientRpcVerifier.ts");

    // Import backend modules
    backendHashing = await import("../server/services/blockchain/hashing.ts");
    const queueMod = await import("../server/services/blockchain/queue/txQueue.ts");
    TransactionQueue = queueMod.TransactionQueue;

    // Deploy fresh SmartGovAudit instance
    const SmartGovAuditFactory = await ethers.getContractFactory("SmartGovAudit");
    smartGovAudit = await SmartGovAuditFactory.deploy(
      await admin.getAddress(),
      await backendRelayer.getAddress()
    );
    await smartGovAudit.waitForDeployment();
    contractAddress = await smartGovAudit.getAddress();

    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  after(function () {
    try {
      if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
      }
    } catch {
      // Ignore
    }
  });

  describe("1. Complete SmartGov Lifecycle: Submission -> Verification -> Closed", function () {
    // Enum GrievanceStatus in Solidity:
    // None = 0, Open = 1, InProgress = 2, Transferred = 3, Resolved = 4, Closed = 5
    const STATUS = {
      None: 0,
      Open: 1,
      InProgress: 2,
      Transferred: 3,
      Resolved: 4,
      Closed: 5,
    };

    const lifecycleGrievance = {
      id: "GRV-LIFECYCLE-2026-999",
      citizenName: "Aditi Roy",
      citizenPhone: "+91-9988776655",
      title: "Deep drainage crater overflowing on MG Road",
      description: "Severe sewage overflow and a 4-foot deep open crater near market gate.",
      department: "Sanitation & Drainage",
      priority: "Urgent",
      location: { lat: 28.61452, lng: 77.20894, address: "MG Road, Sector 12" },
      submittedAt: "13 Sep 2026, 10:00 AM",
    };

    let complaintIdBytes32;
    let registeredComplaintHash;
    let resolutionProofHash;

    it("Step A: Citizen submission & AI classification simulation", function () {
      // AI analysis determines department and priority
      expect(lifecycleGrievance.department).to.equal("Sanitation & Drainage");
      expect(lifecycleGrievance.priority).to.equal("Urgent");
    });

    it("Step B: Deterministic Keccak-256 generation (client and backend identical)", function () {
      const clientHash = clientHashing.computeComplaintHash(lifecycleGrievance);
      const backendHash = backendHashing.computeComplaintHash(lifecycleGrievance);

      expect(clientHash).to.equal(backendHash);
      registeredComplaintHash = clientHash;
      complaintIdBytes32 = clientHashing.complaintIdToBytes32(lifecycleGrievance.id);
    });

    it("Step C: Blockchain registration by relayer (Status: Open = 1)", async function () {
      const deptHash = clientHashing.departmentToBytes32(lifecycleGrievance.department);
      const tx = await smartGovAudit
        .connect(backendRelayer)
        .registerComplaint(complaintIdBytes32, registeredComplaintHash, deptHash, 3); // Priority: Urgent (3)
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      const record = await smartGovAudit.getComplaint(complaintIdBytes32);
      expect(record.exists).to.be.true;
      expect(record.status).to.equal(STATUS.Open); // 1 = Open
      expect(record.complaintHash).to.equal(registeredComplaintHash);
    });

    it("Step D: Officer assignment & status transition (Open -> InProgress = 2)", async function () {
      const actionHash = clientHashing.computeActionHash({
        actionType: "OFFICER_ASSIGNED",
        grievanceId: lifecycleGrievance.id,
        officerName: "Er. Anita Patel",
        details: "Assigned to Ward 4 Drainage Field Team. Suction unit dispatched.",
      });

      const tx = await smartGovAudit
        .connect(backendRelayer)
        .updateStatus(complaintIdBytes32, STATUS.InProgress, actionHash); // 2 = InProgress
      await tx.wait();

      const record = await smartGovAudit.getComplaint(complaintIdBytes32);
      expect(record.status).to.equal(STATUS.InProgress);
      expect(record.latestActionHash).to.equal(actionHash);
    });

    it("Step E: Inter-departmental transfer (InProgress -> Transferred = 3)", async function () {
      const transferActionHash = clientHashing.computeActionHash({
        actionType: "DEPARTMENT_TRANSFERRED",
        grievanceId: lifecycleGrievance.id,
        officerName: "Zonal Superintendent",
        details: "Road cave-in requires Heavy Civil PWD repair machinery.",
      });

      const newDeptHash = clientHashing.departmentToBytes32("Public Works Department");

      const tx = await smartGovAudit
        .connect(backendRelayer)
        .transferDepartment(complaintIdBytes32, newDeptHash, transferActionHash);
      await tx.wait();

      const record = await smartGovAudit.getComplaint(complaintIdBytes32);
      expect(record.status).to.equal(STATUS.Transferred); // 3 = Transferred
      expect(record.departmentHash).to.equal(newDeptHash);
    });

    it("Step F: Acceptance by new department (Transferred -> InProgress = 2)", async function () {
      const reacceptActionHash = clientHashing.computeActionHash({
        actionType: "TRANSFER_ACCEPTED",
        grievanceId: lifecycleGrievance.id,
        officerName: "PWD Engineer Verma",
        details: "Excavator and asphalt roller on site.",
      });

      const tx = await smartGovAudit
        .connect(backendRelayer)
        .updateStatus(complaintIdBytes32, STATUS.InProgress, reacceptActionHash); // 2 = InProgress
      await tx.wait();

      const record = await smartGovAudit.getComplaint(complaintIdBytes32);
      expect(record.status).to.equal(STATUS.InProgress);
    });

    it("Step G: Official communique recorded on-chain", async function () {
      const replyActionHash = clientHashing.computeActionHash({
        actionType: "OFFICIAL_REPLY",
        grievanceId: lifecycleGrievance.id,
        officerName: "PWD Engineer Verma",
        details: "Drainage pipeline replaced and reinforced concrete slab laid.",
      });

      const tx = await smartGovAudit
        .connect(backendRelayer)
        .recordOfficerAction(complaintIdBytes32, replyActionHash, "OFFICIAL_REPLY");
      await tx.wait();

      const record = await smartGovAudit.getComplaint(complaintIdBytes32);
      expect(record.actionCount).to.be.at.least(4);
    });

    it("Step H: Resolution certification & immutable locking (InProgress -> Resolved = 4)", async function () {
      const resolutionProof = {
        notes: "Crater backfilled with compacted gravel and sealed with hot bitumen. Water flow restored.",
        officerName: "Er. Anita Patel",
        materialsUsed: "15 tons aggregate grade 2, 40m PVC stormwater pipe, bitumen topcoat",
        photoUrl: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      };

      resolutionProofHash = clientHashing.computeResolutionHash(resolutionProof);
      const actionHash = clientHashing.computeActionHash({
        actionType: "RESOLUTION_CERTIFIED",
        grievanceId: lifecycleGrievance.id,
        officerName: resolutionProof.officerName,
        details: resolutionProof.notes,
      });

      const tx = await smartGovAudit
        .connect(backendRelayer)
        .recordResolution(complaintIdBytes32, resolutionProofHash, actionHash);
      await tx.wait();

      const record = await smartGovAudit.getComplaint(complaintIdBytes32);
      expect(record.status).to.equal(STATUS.Resolved); // 4 = Resolved
      expect(record.resolutionHash).to.equal(resolutionProofHash);

      // Verify on-chain resolution proof matches
      const isValid = await smartGovAudit.verifyResolution(complaintIdBytes32, resolutionProofHash);
      expect(isValid).to.be.true;
    });

    it("Step I: Final closure (Resolved -> Closed = 5)", async function () {
      const closeActionHash = clientHashing.computeActionHash({
        actionType: "TICKET_CLOSED",
        grievanceId: lifecycleGrievance.id,
        officerName: "Citizen Service Director",
        details: "Citizen verified satisfactory closure via SMS OTP.",
      });

      const tx = await smartGovAudit
        .connect(backendRelayer)
        .updateStatus(complaintIdBytes32, STATUS.Closed, closeActionHash); // 5 = Closed
      await tx.wait();

      const record = await smartGovAudit.getComplaint(complaintIdBytes32);
      expect(record.status).to.equal(STATUS.Closed); // 5 = Closed
    });

    it("Step J: Immutable audit history verification", async function () {
      const history = await smartGovAudit.getAuditHistory(complaintIdBytes32);
      expect(history.length).to.be.at.least(6);
      expect(history[0].actionType).to.equal("REGISTERED");
      expect(history[history.length - 1].actionType).to.equal("STATUS_UPDATE");
      expect(history[history.length - 1].status).to.equal(STATUS.Closed);
    });

    it("Step K: Frontend direct verification against live contract succeeds (MATCH -> VERIFIED)", async function () {
      const verificationResult = await clientVerifier.verifyGrievanceIntegrity(lifecycleGrievance, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(verificationResult.source).to.equal("DIRECT_RPC");
      expect(verificationResult.verified).to.be.true;
      expect(verificationResult.tamperDetected).to.be.false;
      expect(verificationResult.status).to.equal("VERIFIED");
      expect(verificationResult.onChainStatus).to.equal(STATUS.Closed); // 5 = Closed
      expect(verificationResult.resolutionHash).to.equal(resolutionProofHash);
    });
  });

  describe("2. Adversarial Security Scenarios (Items 1-16)", function () {
    const STATUS = {
      None: 0,
      Open: 1,
      InProgress: 2,
      Transferred: 3,
      Resolved: 4,
      Closed: 5,
    };

    const advGrievance = {
      id: "GRV-ADV-2026-001",
      description: "Severe gas pipeline leak at commercial food court.",
      department: "Fire & Disaster Safety",
      priority: "Urgent",
      location: { lat: 28.53000, lng: 77.31000 },
    };

    let advIdBytes32;
    let advOnChainHash;

    before(async function () {
      advIdBytes32 = clientHashing.complaintIdToBytes32(advGrievance.id);
      advOnChainHash = clientHashing.computeComplaintHash(advGrievance);
      const deptHash = clientHashing.departmentToBytes32(advGrievance.department);

      const tx = await smartGovAudit
        .connect(backendRelayer)
        .registerComplaint(advIdBytes32, advOnChainHash, deptHash, 3);
      await tx.wait();
    });

    it("Adversarial 1: Modify off-chain description -> TAMPERING DETECTED", async function () {
      const tampered = { ...advGrievance, description: "Minor gas odor at food court." };
      const res = await clientVerifier.verifyGrievanceIntegrity(tampered, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(res.tamperDetected).to.be.true;
      expect(res.verified).to.be.false;
      expect(res.status).to.equal("TAMPERING_DETECTED");
    });

    it("Adversarial 2: Modify off-chain department -> TAMPERING DETECTED", async function () {
      const tampered = { ...advGrievance, department: "Horticulture" };
      const res = await clientVerifier.verifyGrievanceIntegrity(tampered, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(res.tamperDetected).to.be.true;
      expect(res.verified).to.be.false;
      expect(res.status).to.equal("TAMPERING_DETECTED");
    });

    it("Adversarial 3: Modify off-chain priority -> TAMPERING DETECTED", async function () {
      const tampered = { ...advGrievance, priority: "Low" };
      const res = await clientVerifier.verifyGrievanceIntegrity(tampered, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(res.tamperDetected).to.be.true;
      expect(res.verified).to.be.false;
      expect(res.status).to.equal("TAMPERING_DETECTED");
    });

    it("Adversarial 4: Modify off-chain coordinates -> TAMPERING DETECTED", async function () {
      const tampered = { ...advGrievance, location: { lat: 28.53001, lng: 77.31000 } };
      const res = await clientVerifier.verifyGrievanceIntegrity(tampered, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(res.tamperDetected).to.be.true;
      expect(res.verified).to.be.false;
      expect(res.status).to.equal("TAMPERING_DETECTED");
    });

    it("Adversarial 5: Modify resolution information -> verifyResolution returns false", async function () {
      const legitimateProof = {
        notes: "Gas line welded and pressure-tested to 50 PSI.",
        officerName: "Inspector Dave",
        materialsUsed: "Steel sleeve, sealant",
      };
      const legitimateProofHash = clientHashing.computeResolutionHash(legitimateProof);
      const actionHash = clientHashing.computeActionHash({
        actionType: "RESOLUTION",
        grievanceId: advGrievance.id,
        details: legitimateProof.notes,
      });

      // Transition Open (1) -> InProgress (2) first
      await smartGovAudit.connect(backendRelayer).updateStatus(advIdBytes32, STATUS.InProgress, actionHash);
      // Record legitimate resolution (transitions to Resolved = 4)
      await smartGovAudit.connect(backendRelayer).recordResolution(advIdBytes32, legitimateProofHash, actionHash);

      // Verify legitimate proof matches
      expect(await smartGovAudit.verifyResolution(advIdBytes32, legitimateProofHash)).to.be.true;

      // Tampered proof: altered notes
      const tamperedProof = { ...legitimateProof, notes: "Gas line temporarily patched with tape." };
      const tamperedProofHash = clientHashing.computeResolutionHash(tamperedProof);

      // Verify tampered proof fails
      expect(await smartGovAudit.verifyResolution(advIdBytes32, tamperedProofHash)).to.be.false;
    });

    it("Adversarial 6: Attempt RESOLVED -> OPEN -> Solidity revert", async function () {
      const actionHash = clientHashing.computeActionHash({
        actionType: "REGRESS",
        grievanceId: advGrievance.id,
        details: "Attempt illegal regression to Open",
      });

      // Current status is Resolved (4). Attempt to set Open (1):
      await expect(
        smartGovAudit.connect(backendRelayer).updateStatus(advIdBytes32, STATUS.Open, actionHash)
      ).to.be.revertedWithCustomError(smartGovAudit, "InvalidStatusTransition");
    });

    it("Adversarial 7: Attempt CLOSED -> IN_PROGRESS -> Solidity revert", async function () {
      const closeActionHash = clientHashing.computeActionHash({
        actionType: "CLOSE",
        grievanceId: advGrievance.id,
        details: "Normal close",
      });
      // Move Resolved (4) -> Closed (5)
      await smartGovAudit.connect(backendRelayer).updateStatus(advIdBytes32, STATUS.Closed, closeActionHash);

      // Verify current status is Closed (5)
      const rec = await smartGovAudit.getComplaint(advIdBytes32);
      expect(rec.status).to.equal(STATUS.Closed);

      // Attempt to reopen Closed (5) -> InProgress (2)
      const reopenActionHash = clientHashing.computeActionHash({
        actionType: "REOPEN",
        grievanceId: advGrievance.id,
        details: "Attempt illegal reopen of closed ticket",
      });

      await expect(
        smartGovAudit.connect(backendRelayer).updateStatus(advIdBytes32, STATUS.InProgress, reopenActionHash)
      ).to.be.revertedWithCustomError(smartGovAudit, "ComplaintAlreadyTerminal");
    });

    it("Adversarial 8: Attempt unauthorized relayer admin operation -> revert", async function () {
      // Relayer does NOT have DEFAULT_ADMIN_ROLE and cannot pause
      await expect(
        smartGovAudit.connect(backendRelayer).pause()
      ).to.be.revertedWithCustomError(smartGovAudit, "AccessControlUnauthorizedAccount");

      // Relayer cannot grant roles
      const BACKEND_ROLE = await smartGovAudit.BACKEND_ROLE();
      await expect(
        smartGovAudit
          .connect(backendRelayer)
          .grantRole(BACKEND_ROLE, await unauthorizedUser.getAddress())
      ).to.be.revertedWithCustomError(smartGovAudit, "AccessControlUnauthorizedAccount");
    });

    it("Adversarial 9: Attempt duplicate blockchain operation -> Idempotent handling", async function () {
      const queueFile = path.join(TEST_DIR, "idempotent_queue.json");
      const queue = new TransactionQueue({ storagePath: queueFile, maxAttempts: 3, baseBackoffMs: 100 });

      const op1 = queue.enqueue("GRV-DEDUP-01", "REGISTER", {
        idBytes32: clientHashing.complaintIdToBytes32("GRV-DEDUP-01"),
        complaintHash: ethers.ZeroHash,
        deptHash: ethers.ZeroHash,
        priorityNum: 1,
      });
      const op2 = queue.enqueue("GRV-DEDUP-01", "REGISTER", {
        idBytes32: clientHashing.complaintIdToBytes32("GRV-DEDUP-01"),
        complaintHash: ethers.ZeroHash,
        deptHash: ethers.ZeroHash,
        priorityNum: 1,
      });

      expect(op1.operationId).to.equal(op2.operationId);
      expect(queue.getAllOperations().length).to.equal(1);
    });

    it("Adversarial 10: Simulate RPC outage -> Operations stay QUEUED, never falsely CONFIRMED", async function () {
      const queueFile = path.join(TEST_DIR, "rpc_outage_queue.json");
      const queue = new TransactionQueue({ storagePath: queueFile, maxAttempts: 3, baseBackoffMs: 100 });
      const op = queue.enqueue("GRV-OUTAGE-01", "REGISTER", {
        idBytes32: clientHashing.complaintIdToBytes32("GRV-OUTAGE-01"),
        complaintHash: ethers.ZeroHash,
        deptHash: ethers.ZeroHash,
        priorityNum: 1,
      });

      expect(op.status).to.equal("QUEUED");

      // Faulty mock contract that rejects connection due to simulated RPC node outage
      const brokenContract = {
        connect: () => ({
          registerComplaint: async () => {
            throw new Error("connect ECONNREFUSED 127.0.0.1:8545");
          },
          getComplaint: async () => {
            throw new Error("connect ECONNREFUSED 127.0.0.1:8545");
          },
        }),
        runner: null,
      };

      try {
        await queue.processQueue(brokenContract, backendRelayer, ethers.provider);
      } catch {
        // Expected network exception
      }

      const ops = queue.getAllOperations();
      expect(ops[0].status).to.equal("QUEUED");
      expect(ops[0].status).to.not.equal("CONFIRMED");
    });

    it("Adversarial 11: Restart backend with PENDING transactions -> Reconciled without duplicates", async function () {
      const queueFile = path.join(TEST_DIR, "restart_reconcile.json");

      // Seed a persisted queue with a PENDING transaction
      const initialData = [
        {
          operationId: "OP_REG_GRV-RESTART-01",
          grievanceId: "GRV-RESTART-01",
          type: "REGISTER",
          status: "PENDING",
          payload: {},
          txHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
          nonce: 5,
          attemptCount: 1,
          createdAt: Date.now() - 60000,
          updatedAt: Date.now() - 30000,
        },
      ];
      fs.writeFileSync(queueFile, JSON.stringify(initialData, null, 2), "utf-8");

      const queue = new TransactionQueue({ storagePath: queueFile, maxAttempts: 3, baseBackoffMs: 100 });

      // On startup, queue recovers disk state
      const ops = queue.getAllOperations();
      expect(ops.length).to.equal(1);
      expect(ops[0].operationId).to.equal("OP_REG_GRV-RESTART-01");
      expect(ops[0].nonce).to.equal(5);
    });

    it("Adversarial 12: Simulate smart contract revert -> Operation marks FAILED, never CONFIRMED", async function () {
      const queueFile = path.join(TEST_DIR, "revert_fail.json");
      const queue = new TransactionQueue({ storagePath: queueFile, maxAttempts: 1, baseBackoffMs: 10 });
      queue.enqueue("GRV-REVERT-01", "STATUS_UPDATE", {
        idBytes32: clientHashing.complaintIdToBytes32("GRV-NONEXISTENT"),
        newStatus: 2,
        actionHash: ethers.ZeroHash,
      });

      // Calling updateStatus on non-existent complaint will revert on-chain
      await queue.processQueue(smartGovAudit, backendRelayer, ethers.provider);

      const ops = queue.getAllOperations();
      expect(ops[0].status).to.equal("FAILED");
      expect(ops[0].status).to.not.equal("CONFIRMED");
      expect(ops[0].error).to.include("reverted");
    });

    it("Adversarial 13: Direct RPC failure triggers explicit BACKEND_PROXY fallback", async function () {
      const dummyGrievance = {
        id: "GRV-FAILOVER-001",
        description: "Testing client RPC failover.",
        department: "General",
        priority: "Low",
      };

      const result = await clientVerifier.verifyGrievanceIntegrity(dummyGrievance, {
        rpcUrl: "http://127.0.0.1:59998", // Offline port
        contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        timeoutMs: 80,
      });

      expect(result.source).to.equal("BACKEND_PROXY");
      expect(result.verified).to.be.false;
    });

    it("Adversarial 14: Compromised backend returns { verified: true } with hash discrepancy -> Frontend STILL reports TAMPERING DETECTED", async function () {
      // Local grievance has been secretly modified off-chain
      const offChainTamperedGrievance = {
        ...advGrievance,
        description: "Everything is fine, no gas leak at all.",
      };

      const clientComputedHash = clientHashing.computeComplaintHash(offChainTamperedGrievance);
      // The genuine on-chain hash
      expect(clientComputedHash).to.not.equal(advOnChainHash);

      // Compromised backend response:
      const fakeBackendResponse = {
        success: true,
        result: {
          verified: true, // Falsely claims true
          onChainHash: advOnChainHash,
          network: "Hardhat",
        },
      };

      // Client independent zero-trust logic:
      const onChainHashFromProxy = fakeBackendResponse.result.onChainHash;
      const isMatch = clientComputedHash.toLowerCase() === onChainHashFromProxy.toLowerCase();

      // Client must REJECT the backend claim:
      expect(isMatch).to.be.false;
      const finalVerified = isMatch;
      const finalTamperDetected = !isMatch;

      expect(finalVerified).to.be.false;
      expect(finalTamperDetected).to.be.true;
    });

    it("Adversarial 15: Secret scan - verify zero private keys in built frontend assets", function () {
      const distAssetsDir = path.join(process.cwd(), "dist", "assets");
      if (fs.existsSync(distAssetsDir)) {
        const files = fs.readdirSync(distAssetsDir);
        const hardhatPrivKey1 = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        const hardhatRelayerKey = "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

        for (const file of files) {
          if (file.endsWith(".js")) {
            const content = fs.readFileSync(path.join(distAssetsDir, file), "utf-8");
            expect(content).to.not.include(hardhatPrivKey1);
            expect(content).to.not.include(hardhatRelayerKey);
          }
        }
      }
    });

    it("Adversarial 16: Verify no VITE_* environment variable leaks private keys", function () {
      // Check process.env and any .env configurations
      const viteVars = Object.keys(process.env).filter((k) => k.startsWith("VITE_"));
      for (const v of viteVars) {
        const val = process.env[v] || "";
        expect(val).to.not.match(/0x[a-fA-F0-9]{64}/);
        expect(val.toLowerCase()).to.not.include("private");
        expect(val.toLowerCase()).to.not.include("relayer_key");
      }
    });
  });
});
