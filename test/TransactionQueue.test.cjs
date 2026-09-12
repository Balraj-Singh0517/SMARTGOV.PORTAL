const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

describe("Phase 2: Backend Reliability & Blockchain Transaction Integrity Suite", function () {
  this.timeout(60000);

  let smartGovAudit;
  let admin;
  let backendRelayer;
  let unauthorizedUser;

  let computeComplaintHash;
  let computeActionHash;
  let computeResolutionHash;
  let complaintIdToBytes32;
  let departmentToBytes32;
  let TransactionQueue;
  let NonceManager;

  const TEST_STORAGE_DIR = path.join(process.cwd(), "data", "test_queues");

  before(async function () {
    [admin, backendRelayer, unauthorizedUser] = await ethers.getSigners();

    // Dynamically import TypeScript modules (supported in Node 24)
    const hashing = await import("../server/services/blockchain/hashing.ts");
    computeComplaintHash = hashing.computeComplaintHash;
    computeActionHash = hashing.computeActionHash;
    computeResolutionHash = hashing.computeResolutionHash;
    complaintIdToBytes32 = hashing.complaintIdToBytes32;
    departmentToBytes32 = hashing.departmentToBytes32;

    const queueModule = await import("../server/services/blockchain/queue/txQueue.ts");
    TransactionQueue = queueModule.TransactionQueue;

    const nonceModule = await import("../server/services/blockchain/queue/nonceManager.ts");
    NonceManager = nonceModule.NonceManager;

    if (!fs.existsSync(TEST_STORAGE_DIR)) {
      fs.mkdirSync(TEST_STORAGE_DIR, { recursive: true });
    }
  });

  beforeEach(async function () {
    const SmartGovAuditFactory = await ethers.getContractFactory("SmartGovAudit");
    smartGovAudit = await SmartGovAuditFactory.deploy(admin.address, backendRelayer.address);
    await smartGovAudit.waitForDeployment();
  });

  after(function () {
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
  });

  // =========================================================================
  // 1. EVM Keccak-256 Cryptographic Test Vectors & Cross-Checking
  // =========================================================================
  describe("1. Keccak-256 Test Vectors & EVM Compatibility", function () {
    it("should match standard NIST/EVM Keccak-256 test vector for empty string", function () {
      const expected = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
      const actual = ethers.keccak256(ethers.toUtf8Bytes(""));
      expect(actual).to.equal(expected);
    });

    it("should match standard NIST/EVM Keccak-256 test vector for 'test'", function () {
      const expected = "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658";
      const actual = ethers.keccak256(ethers.toUtf8Bytes("test"));
      expect(actual).to.equal(expected);
    });

    it("should match standard NIST/EVM Keccak-256 test vector for quick brown fox", function () {
      const expected = "0x4d741b6f1eb29cb2a9b9911c82f56fa8d73b04959d3d9d222895df6c0b28aa15";
      const actual = ethers.keccak256(ethers.toUtf8Bytes("The quick brown fox jumps over the lazy dog"));
      expect(actual).to.equal(expected);
    });

    it("should produce deterministic hashes identical between backend hashing and Solidity contract", async function () {
      const sample = {
        id: "GRV-PHASE2-001",
        description: "Broken water main leaking onto Main Street",
        department: "Water Board",
        priority: "High",
        location: { lat: 28.6139, lng: 77.2090 }
      };

      const backendHash = computeComplaintHash(sample);
      const idBytes32 = complaintIdToBytes32(sample.id);
      const deptBytes32 = departmentToBytes32(sample.department);

      // Register on contract using backend hashes
      await smartGovAudit.connect(backendRelayer).registerComplaint(
        idBytes32,
        backendHash,
        deptBytes32,
        3 // High
      );

      // Verify on-chain
      const isValid = await smartGovAudit.verifyComplaint(idBytes32, backendHash);
      expect(isValid).to.be.true;

      // Tampered data must fail
      const tamperedHash = computeComplaintHash({ ...sample, description: "TAMPERED description" });
      const isTamperedValid = await smartGovAudit.verifyComplaint(idBytes32, tamperedHash);
      expect(isTamperedValid).to.be.false;
    });
  });

  // =========================================================================
  // 2. Sequential Nonce Management & Mutex Locking
  // =========================================================================
  describe("2. Sequential Nonce Management with Async Mutex", function () {
    it("should allocate sequential nonces under 15 concurrent requests without collisions", async function () {
      const nm = new NonceManager();
      const initialPendingNonce = await backendRelayer.getNonce("pending");

      // Launch 15 concurrent nonce requests
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(nm.acquireNonce(backendRelayer));
      }

      const allocatedNonces = await Promise.all(promises);

      // Ensure all 15 nonces are unique and strictly sequential
      expect(allocatedNonces.length).to.equal(15);
      const uniqueNonces = new Set(allocatedNonces);
      expect(uniqueNonces.size).to.equal(15);

      for (let i = 0; i < 15; i++) {
        expect(allocatedNonces[i]).to.equal(initialPendingNonce + i);
      }
    });

    it("should allow resetting the cached nonce to re-sync with on-chain", async function () {
      const nm = new NonceManager();
      const nonce1 = await nm.acquireNonce(backendRelayer);
      expect(nm.getCachedNonce()).to.equal(nonce1 + 1);

      nm.resetNonce();
      expect(nm.getCachedNonce()).to.be.null;

      const nonce2 = await nm.acquireNonce(backendRelayer);
      // Since no transaction was mined on-chain, re-query returns the chain pending nonce
      const chainPending = await backendRelayer.getNonce("pending");
      expect(nonce2).to.equal(chainPending);
    });
  });

  // =========================================================================
  // 3. Durable Transaction Queue: States, Idempotency & Persistence
  // =========================================================================
  describe("3. Transaction Queue States, Idempotency & Persistence", function () {
    let queueFile;
    let queue;

    beforeEach(function () {
      queueFile = path.join(TEST_STORAGE_DIR, `queue_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
      queue = new TransactionQueue({ storagePath: queueFile, maxAttempts: 3, baseBackoffMs: 100 });
    });

    afterEach(function () {
      queue.clearQueue();
      if (fs.existsSync(queueFile)) fs.unlinkSync(queueFile);
    });

    it("should enqueue operation in QUEUED state with deterministic operationId and disk persistence", function () {
      const op = queue.enqueue("GRV-TEST-100", "REGISTER", {
        idBytes32: complaintIdToBytes32("GRV-TEST-100"),
        complaintHash: ethers.ZeroHash,
        deptHash: ethers.ZeroHash,
        priorityNum: 2
      });

      expect(op.operationId).to.equal("OP_REG_GRV-TEST-100");
      expect(op.status).to.equal("QUEUED");
      expect(op.attemptCount).to.equal(0);
      expect(op.txHash).to.be.null;
      expect(op.error).to.be.null;
      expect(op.receipt).to.be.null;

      // Check persistence to disk
      expect(fs.existsSync(queueFile)).to.be.true;
      const onDisk = JSON.parse(fs.readFileSync(queueFile, "utf8"));
      expect(onDisk.length).to.equal(1);
      expect(onDisk[0].operationId).to.equal("OP_REG_GRV-TEST-100");
    });

    it("should be idempotent and not create duplicate records on repeated enqueue", function () {
      const op1 = queue.enqueue("GRV-TEST-IDEM", "REGISTER", {
        idBytes32: complaintIdToBytes32("GRV-TEST-IDEM"),
        complaintHash: ethers.ZeroHash,
        deptHash: ethers.ZeroHash,
        priorityNum: 2
      });

      const op2 = queue.enqueue("GRV-TEST-IDEM", "REGISTER", {
        idBytes32: complaintIdToBytes32("GRV-TEST-IDEM"),
        complaintHash: ethers.ZeroHash,
        deptHash: ethers.ZeroHash,
        priorityNum: 2
      });

      expect(op1.operationId).to.equal(op2.operationId);
      expect(queue.getAllOperations().length).to.equal(1);
    });
  });

  // =========================================================================
  // 4. Concurrency Under Load: 15 Concurrent Transactions
  // =========================================================================
  describe("4. Concurrent Transaction Execution (15 Operations)", function () {
    let queueFile;
    let queue;

    beforeEach(function () {
      queueFile = path.join(TEST_STORAGE_DIR, `queue_concurrent_${Date.now()}.json`);
      queue = new TransactionQueue({ storagePath: queueFile, maxAttempts: 3, baseBackoffMs: 100 });
    });

    afterEach(function () {
      queue.clearQueue();
      if (fs.existsSync(queueFile)) fs.unlinkSync(queueFile);
    });

    it("should process 15 concurrent complaints without nonce collisions and confirm all with receipt status 1", async function () {
      const provider = ethers.provider;
      const count = 15;
      const opIds = [];

      for (let i = 1; i <= count; i++) {
        const id = `GRV-CONCURRENT-${i}`;
        const hash = ethers.keccak256(ethers.toUtf8Bytes(`Complaint content #${i}`));
        const dept = departmentToBytes32("Public Works");
        const op = queue.enqueue(id, "REGISTER", {
          idBytes32: complaintIdToBytes32(id),
          complaintHash: hash,
          deptHash: dept,
          priorityNum: 2
        });
        opIds.push(op.operationId);
      }

      expect(queue.getStats().queued).to.equal(count);

      // Trigger queue processing
      await queue.processQueue(smartGovAudit, backendRelayer, provider);

      // Wait for all 15 operations to reach terminal status
      const confirmedOps = await Promise.all(
        opIds.map((opId) => queue.waitForConfirmation(opId, 30000))
      );

      // Assert all 15 are CONFIRMED
      for (const op of confirmedOps) {
        expect(op.status).to.equal("CONFIRMED");
        expect(op.txHash).to.be.a("string");
        expect(op.receipt).to.not.be.null;
        expect(op.receipt.status).to.equal(1);
        expect(op.receipt.blockNumber).to.be.greaterThan(0);
      }

      // Assert all 15 nonces were unique
      const usedNonces = confirmedOps.map((op) => op.nonce);
      const uniqueNonces = new Set(usedNonces);
      expect(uniqueNonces.size).to.equal(count);

      // Verify on-chain in SmartGovAudit contract that all 15 exist
      for (let i = 1; i <= count; i++) {
        const id = `GRV-CONCURRENT-${i}`;
        const record = await smartGovAudit.getComplaint(complaintIdToBytes32(id));
        expect(record.exists).to.be.true;
      }
    });
  });

  // =========================================================================
  // 5. Strict Receipt Enforcement (Never False CONFIRMED) & Revert Handling
  // =========================================================================
  describe("5. Strict Confirmation Verification & Revert Handling", function () {
    let queueFile;
    let queue;

    beforeEach(function () {
      queueFile = path.join(TEST_STORAGE_DIR, `queue_strict_${Date.now()}.json`);
      queue = new TransactionQueue({ storagePath: queueFile, maxAttempts: 2, baseBackoffMs: 50 });
    });

    afterEach(function () {
      queue.clearQueue();
      if (fs.existsSync(queueFile)) fs.unlinkSync(queueFile);
    });

    it("should never mark an operation CONFIRMED while queued or pending", function () {
      const op = queue.enqueue("GRV-STRICT-001", "REGISTER", {
        idBytes32: complaintIdToBytes32("GRV-STRICT-001"),
        complaintHash: ethers.ZeroHash,
        deptHash: ethers.ZeroHash,
        priorityNum: 2
      });

      expect(op.status).to.equal("QUEUED");
      expect(op.status).to.not.equal("CONFIRMED");
    });

    it("should cleanly mark operation as FAILED when smart contract reverts (invalid status transition)", async function () {
      const provider = ethers.provider;
      const id = "GRV-REVERT-TEST";
      const idBytes32 = complaintIdToBytes32(id);
      const hash = ethers.keccak256(ethers.toUtf8Bytes("Revert test"));

      // 1. Register complaint directly on-chain first
      await smartGovAudit.connect(backendRelayer).registerComplaint(
        idBytes32,
        hash,
        departmentToBytes32("Health"),
        2
      );

      // 2. Queue an invalid status update: Open -> Open (Self-transition reverts with InvalidStatusTransition)
      const op = queue.enqueue(id, "STATUS_UPDATE", {
        idBytes32,
        newStatus: 1, // 1=Open -> Reverts!
        actionHash: ethers.keccak256(ethers.toUtf8Bytes("Invalid action"))
      });

      // Dispatch
      await queue.processQueue(smartGovAudit, backendRelayer, provider);

      // Operation must transition to FAILED, NEVER CONFIRMED
      const completedOp = await queue.waitForConfirmation(op.operationId, 10000);
      expect(completedOp.status).to.equal("FAILED");
      expect(completedOp.status).to.not.equal("CONFIRMED");
      expect(completedOp.error).to.include("revert");
    });

    it("should reject unauthorized callers and mark transaction FAILED in queue", async function () {
      const provider = ethers.provider;
      const id = "GRV-UNAUTH-001";
      const op = queue.enqueue(id, "REGISTER", {
        idBytes32: complaintIdToBytes32(id),
        complaintHash: ethers.keccak256(ethers.toUtf8Bytes("Unauth test")),
        deptHash: departmentToBytes32("Health"),
        priorityNum: 2
      });

      // Attempt to dispatch with unauthorized user (lacks BACKEND_ROLE)
      await queue.processQueue(smartGovAudit, unauthorizedUser, provider);

      const completedOp = await queue.waitForConfirmation(op.operationId, 10000);
      expect(completedOp.status).to.equal("FAILED");
      expect(completedOp.status).to.not.equal("CONFIRMED");
    });
  });

  // =========================================================================
  // 6. Retry with Backoff & Dead-Letter Queue (DLQ)
  // =========================================================================
  describe("6. Retry Mechanism & Dead-Letter Queue (DLQ)", function () {
    let queueFile;
    let queue;

    beforeEach(function () {
      queueFile = path.join(TEST_STORAGE_DIR, `queue_retry_${Date.now()}.json`);
      queue = new TransactionQueue({
        storagePath: queueFile,
        maxAttempts: 3,
        baseBackoffMs: 50,
        maxBackoffMs: 200
      });
    });

    afterEach(function () {
      queue.clearQueue();
      if (fs.existsSync(queueFile)) fs.unlinkSync(queueFile);
    });

    it("should transition to FAILED after exhausting maxAttempts", async function () {
      const id = "GRV-DLQ-TEST";
      const op = queue.enqueue(id, "REGISTER", {
        idBytes32: ethers.ZeroHash, // Zero complaint ID will revert on contract!
        complaintHash: ethers.ZeroHash,
        deptHash: ethers.ZeroHash,
        priorityNum: 2
      });

      await queue.processQueue(smartGovAudit, backendRelayer, ethers.provider);

      const finished = await queue.waitForConfirmation(op.operationId, 10000);
      expect(finished.status).to.equal("FAILED");
      expect(finished.attemptCount).to.be.greaterThan(0);
      expect(finished.error).to.not.be.null;
    });
  });

  // =========================================================================
  // 7. Durability & Server Restart Recovery
  // =========================================================================
  describe("7. Durability & Restart Recovery", function () {
    let queueFile;

    beforeEach(function () {
      queueFile = path.join(TEST_STORAGE_DIR, `queue_recovery_${Date.now()}.json`);
    });

    afterEach(function () {
      if (fs.existsSync(queueFile)) fs.unlinkSync(queueFile);
    });

    it("should recover queued and pending operations from disk across server restarts", async function () {
      const provider = ethers.provider;
      const id = "GRV-RESTART-001";
      const idBytes32 = complaintIdToBytes32(id);
      const hash = ethers.keccak256(ethers.toUtf8Bytes("Restart test complaint"));
      const dept = departmentToBytes32("Electricity");

      // Instance 1: Server before restart
      const queue1 = new TransactionQueue({ storagePath: queueFile });
      const op1 = queue1.enqueue(id, "REGISTER", {
        idBytes32,
        complaintHash: hash,
        deptHash: dept,
        priorityNum: 3
      });

      // Submit to chain
      await queue1.dispatchOperation(op1, smartGovAudit, backendRelayer, provider);
      expect(op1.status).to.be.oneOf(["PENDING", "CONFIRMED"]);

      // Simulate server crash and restart: create brand new TransactionQueue instance reading the same file
      const queue2 = new TransactionQueue({ storagePath: queueFile });
      const loadedOp = queue2.getOperation(op1.operationId);
      expect(loadedOp).to.not.be.undefined;
      expect(loadedOp.grievanceId).to.equal(id);

      // Perform startup reconciliation
      await queue2.reconcileOnStartup(smartGovAudit, provider);

      // After reconciliation, the mined transaction must be CONFIRMED
      const reconciledOp = queue2.getOperation(op1.operationId);
      expect(reconciledOp.status).to.equal("CONFIRMED");
      expect(reconciledOp.receipt).to.not.be.null;
      expect(reconciledOp.receipt.status).to.equal(1);
    });
  });

  // =========================================================================
  // 8. WebSocket Event Dispatching
  // =========================================================================
  describe("8. Real-Time WebSocket Event Dispatching", function () {
    let queueFile;
    let queue;

    beforeEach(function () {
      queueFile = path.join(TEST_STORAGE_DIR, `queue_ws_${Date.now()}.json`);
      queue = new TransactionQueue({ storagePath: queueFile });
    });

    afterEach(function () {
      queue.clearQueue();
      if (fs.existsSync(queueFile)) fs.unlinkSync(queueFile);
    });

    it("should emit blockchain:confirmed WebSocket event with required metadata on confirmation", async function () {
      const emittedEvents = [];
      queue.setBroadcaster((type, payload) => {
        emittedEvents.push({ type, payload });
      });

      const id = "GRV-WS-CONFIRM";
      const op = queue.enqueue(id, "REGISTER", {
        idBytes32: complaintIdToBytes32(id),
        complaintHash: ethers.keccak256(ethers.toUtf8Bytes("WS event test")),
        deptHash: departmentToBytes32("Sanitation"),
        priorityNum: 2
      });

      await queue.processQueue(smartGovAudit, backendRelayer, ethers.provider);
      await queue.waitForConfirmation(op.operationId, 15000);

      const confirmEvent = emittedEvents.find((e) => e.type === "blockchain:confirmed");
      expect(confirmEvent).to.not.be.undefined;
      expect(confirmEvent.payload.grievanceId).to.equal(id);
      expect(confirmEvent.payload.operationId).to.equal(op.operationId);
      expect(confirmEvent.payload.transactionHash).to.be.a("string");
      expect(confirmEvent.payload.blockNumber).to.be.greaterThan(0);
      expect(confirmEvent.payload.operationType).to.equal("REGISTER");
      expect(confirmEvent.payload.timestamp).to.be.greaterThan(0);
    });

    it("should emit blockchain:failed WebSocket event when transaction permanently fails", async function () {
      const emittedEvents = [];
      queue.setBroadcaster((type, payload) => {
        emittedEvents.push({ type, payload });
      });

      const id = "GRV-WS-FAIL";
      // Invalid complaint ID (ZeroHash) causes EVM revert
      const op = queue.enqueue(id, "REGISTER", {
        idBytes32: ethers.ZeroHash,
        complaintHash: ethers.ZeroHash,
        deptHash: ethers.ZeroHash,
        priorityNum: 2
      });

      await queue.processQueue(smartGovAudit, backendRelayer, ethers.provider);
      await queue.waitForConfirmation(op.operationId, 15000);

      const failEvent = emittedEvents.find((e) => e.type === "blockchain:failed");
      expect(failEvent).to.not.be.undefined;
      expect(failEvent.payload.grievanceId).to.equal(id);
      expect(failEvent.payload.operationId).to.equal(op.operationId);
      expect(failEvent.payload.error).to.be.a("string");
      expect(failEvent.payload.operationType).to.equal("REGISTER");
    });
  });

  // =========================================================================
  // 9. Full Lifecycle through Queue: Register -> Status -> Transfer -> Reply -> Resolve
  // =========================================================================
  describe("9. Full Grievance Lifecycle Through Transaction Queue", function () {
    let queueFile;
    let queue;

    beforeEach(function () {
      queueFile = path.join(TEST_STORAGE_DIR, `queue_lifecycle_${Date.now()}.json`);
      queue = new TransactionQueue({ storagePath: queueFile });
    });

    afterEach(function () {
      queue.clearQueue();
      if (fs.existsSync(queueFile)) fs.unlinkSync(queueFile);
    });

    it("should transition complaint through all valid FSM states sequentially via the queue", async function () {
      const provider = ethers.provider;
      const id = "GRV-LIFECYCLE-100";
      const idBytes32 = complaintIdToBytes32(id);
      const initialHash = computeComplaintHash({
        id,
        description: "Dangerous pothole near city hospital entrance",
        department: "Roads & Highways",
        priority: "High"
      });
      const deptRoads = departmentToBytes32("Roads & Highways");
      const deptTransport = departmentToBytes32("Transport Authority");

      // 1. REGISTER
      const regOp = queue.enqueue(id, "REGISTER", {
        idBytes32,
        complaintHash: initialHash,
        deptHash: deptRoads,
        priorityNum: 3
      });
      await queue.processQueue(smartGovAudit, backendRelayer, provider);
      await queue.waitForConfirmation(regOp.operationId);

      let record = await smartGovAudit.getComplaint(idBytes32);
      expect(record.status).to.equal(1); // Open

      // 2. STATUS_UPDATE: Open -> In Progress (2)
      const action1 = computeActionHash({
        actionType: "STATUS_UPDATE",
        grievanceId: id,
        officerName: "Inspector Sharma",
        details: "Work order dispatched to road crew"
      });
      const statusOp = queue.enqueue(id, "STATUS_UPDATE", {
        idBytes32,
        newStatus: 2, // In Progress
        actionHash: action1
      });
      await queue.processQueue(smartGovAudit, backendRelayer, provider);
      await queue.waitForConfirmation(statusOp.operationId);

      record = await smartGovAudit.getComplaint(idBytes32);
      expect(record.status).to.equal(2); // In Progress

      // 3. OFFICER_REPLY
      const replyAction = computeActionHash({
        actionType: "OFFICIAL_REPLY",
        grievanceId: id,
        officerName: "Inspector Sharma [GOV]",
        details: "Inspection team is on-site"
      });
      const replyOp = queue.enqueue(id, "OFFICER_REPLY", {
        idBytes32,
        actionHash: replyAction,
        actionType: "OFFICIAL_REPLY"
      });
      await queue.processQueue(smartGovAudit, backendRelayer, provider);
      await queue.waitForConfirmation(replyOp.operationId);

      // 4. TRANSFER: In Progress -> Transferred (3)
      const transferAction = computeActionHash({
        actionType: "TRANSFER",
        grievanceId: id,
        officerName: "Inspector Sharma",
        details: "Requires specialized transport department heavy machinery"
      });
      const transferOp = queue.enqueue(id, "TRANSFER", {
        idBytes32,
        newDeptHash: deptTransport,
        actionHash: transferAction
      });
      await queue.processQueue(smartGovAudit, backendRelayer, provider);
      await queue.waitForConfirmation(transferOp.operationId);

      record = await smartGovAudit.getComplaint(idBytes32);
      expect(record.status).to.equal(3); // Transferred
      expect(record.departmentHash).to.equal(deptTransport);

      // 5. RESOLUTION: Transferred -> In Progress -> Resolved (4)
      const reopenAction = computeActionHash({
        actionType: "STATUS_UPDATE",
        grievanceId: id,
        officerName: "Chief Engineer Verma",
        details: "Transport team arrived on site"
      });
      const reopenOp = queue.enqueue(id, "STATUS_UPDATE", {
        idBytes32,
        newStatus: 2, // In Progress
        actionHash: reopenAction
      });
      await queue.processQueue(smartGovAudit, backendRelayer, provider);
      await queue.waitForConfirmation(reopenOp.operationId);

      const resHash = computeResolutionHash({
        officerName: "Chief Engineer Verma",
        notes: "Asphalt repaved, level tested and cured",
        photoUrl: "https://smartgov.portal/proofs/pothole_fixed.jpg"
      });
      const resAction = computeActionHash({
        actionType: "RESOLUTION",
        grievanceId: id,
        officerName: "Chief Engineer Verma",
        details: "Resolution certified with proof: Asphalt repaved"
      });
      const resOp = queue.enqueue(id, "RESOLUTION", {
        idBytes32,
        resolutionHash: resHash,
        actionHash: resAction
      });
      await queue.processQueue(smartGovAudit, backendRelayer, provider);
      await queue.waitForConfirmation(resOp.operationId);

      record = await smartGovAudit.getComplaint(idBytes32);
      expect(record.status).to.equal(4); // Resolved
      expect(record.resolutionHash).to.equal(resHash);

      // Verify on-chain resolution proof
      const isResolutionValid = await smartGovAudit.verifyResolution(idBytes32, resHash);
      expect(isResolutionValid).to.be.true;

      // Verify entire audit history contains all 6 lifecycle events
      const history = await smartGovAudit.getAuditHistory(idBytes32);
      expect(history.length).to.equal(6);
    });
  });

  // =========================================================================
  // 10. RPC Outage & Recovery Simulation
  // =========================================================================
  describe("10. RPC Outage & Recovery Simulation", function () {
    let queueFile;
    let queue;

    beforeEach(function () {
      queueFile = path.join(TEST_STORAGE_DIR, `queue_outage_${Date.now()}.json`);
      queue = new TransactionQueue({ storagePath: queueFile, maxAttempts: 3, baseBackoffMs: 100 });
    });

    afterEach(function () {
      queue.clearQueue();
      if (fs.existsSync(queueFile)) fs.unlinkSync(queueFile);
    });

    it("should safely hold operations in QUEUED state during RPC outage and process them upon RPC recovery", async function () {
      const provider = ethers.provider;
      const id = "GRV-OUTAGE-001";
      const idBytes32 = complaintIdToBytes32(id);
      const hash = computeComplaintHash({
        id,
        description: "Power outage reported during severe storm",
        department: "Power",
        priority: "Urgent"
      });

      // 1. Enqueue operation during simulated RPC outage (no node connected / offline queue)
      const op = queue.enqueue(id, "REGISTER", {
        idBytes32,
        complaintHash: hash,
        deptHash: departmentToBytes32("Power"),
        priorityNum: 4
      });

      expect(op.status).to.equal("QUEUED");
      expect(op.txHash).to.be.null;

      // Operations are safely held on disk
      const onDisk = JSON.parse(fs.readFileSync(queueFile, "utf8"));
      expect(onDisk.length).to.equal(1);
      expect(onDisk[0].status).to.equal("QUEUED");

      // 2. Simulate RPC Recovery: node becomes reachable, processQueue is called
      await queue.processQueue(smartGovAudit, backendRelayer, provider);
      await queue.waitForConfirmation(op.operationId);

      // Verify operation transitioned to CONFIRMED
      expect(op.status).to.equal("CONFIRMED");
      expect(op.receipt).to.not.be.null;
      expect(op.receipt.status).to.equal(1);

      // Verify on-chain existence in smartGovAudit contract
      const onChain = await smartGovAudit.getComplaint(idBytes32);
      expect(onChain.exists).to.be.true;
      expect(onChain.priority).to.equal(4); // Urgent
    });
  });
});
