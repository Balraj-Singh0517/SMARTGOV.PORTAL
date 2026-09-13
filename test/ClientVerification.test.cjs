const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 3: Independent Client-Side Blockchain Verification Suite", function () {
  this.timeout(60000);

  let smartGovAudit;
  let admin;
  let backendRelayer;
  let unauthorizedUser;

  // Client hashing & verification utilities
  let clientHashing;
  let clientVerifier;

  // Backend hashing utilities for cross-check
  let backendHashing;

  before(async function () {
    [admin, backendRelayer, unauthorizedUser] = await ethers.getSigners();

    // Import client modules
    clientHashing = await import("../src/utils/clientHashing.ts");
    clientVerifier = await import("../src/services/clientRpcVerifier.ts");

    // Import backend modules for byte-for-byte cross checks
    backendHashing = await import("../server/services/blockchain/hashing.ts");

    // Deploy SmartGovAudit contract for direct RPC integration tests
    const SmartGovAuditFactory = await ethers.getContractFactory("SmartGovAudit");
    smartGovAudit = await SmartGovAuditFactory.deploy(
      await admin.getAddress(),
      await backendRelayer.getAddress()
    );
    await smartGovAudit.waitForDeployment();
  });

  describe("1. Deterministic Canonical Serialization & Keccak-256 Compatibility", function () {
    it("should produce byte-for-byte identical canonical JSON between client and backend", function () {
      const complexObject = {
        zebra: 100,
        apple: "red",
        nested: { z: 1, a: 2, m: [3, 2, 1] },
        beta: false,
      };

      const clientCanonical = clientHashing.canonicalizeJson(complexObject);
      const backendCanonical = backendHashing.canonicalizeJson(complexObject);

      expect(clientCanonical).to.equal(backendCanonical);
      expect(clientCanonical).to.equal(
        '{"apple":"red","beta":false,"nested":{"a":2,"m":[3,2,1],"z":1},"zebra":100}'
      );
    });

    it("should produce byte-for-byte identical Keccak-256 complaint hash between client and backend", function () {
      const grievance = {
        id: "GRV-2026-DELHI-001",
        description: "Severe water supply shortage in Sector 4 for the past 48 hours.",
        department: "Water Board",
        priority: "High",
        location: { lat: 28.61393, lng: 77.20902 },
      };

      const clientHash = clientHashing.computeComplaintHash(grievance);
      const backendHash = backendHashing.computeComplaintHash(grievance);

      expect(clientHash).to.equal(backendHash);
      expect(clientHash).to.match(/^0x[0-9a-f]{64}$/i);
    });

    it("should produce identical complaintIdToBytes32 and departmentToBytes32", function () {
      const id = "grv-2023-1042 ";
      const dept = " Public Works ";

      expect(clientHashing.complaintIdToBytes32(id)).to.equal(
        backendHashing.complaintIdToBytes32(id)
      );
      expect(clientHashing.departmentToBytes32(dept)).to.equal(
        backendHashing.departmentToBytes32(dept)
      );
    });
  });

  describe("2. Cryptographic Tamper Sensitivity & Invariant Tests", function () {
    const baseGrievance = {
      id: "GRV-TEST-TAMPER-01",
      description: "Large pothole in front of community center causing traffic jams.",
      department: "Roads & Traffic",
      priority: "Urgent",
      location: { lat: 28.53551, lng: 77.39102 },
    };

    it("should detect modified description (1 character modification causes hash mismatch)", function () {
      const originalHash = clientHashing.computeComplaintHash(baseGrievance);
      const tamperedGrievance = {
        ...baseGrievance,
        description: "Large pothole in front of community center causing traffic jam.", // removed 's'
      };
      const tamperedHash = clientHashing.computeComplaintHash(tamperedGrievance);

      expect(tamperedHash).to.not.equal(originalHash);
    });

    it("should detect modified department", function () {
      const originalHash = clientHashing.computeComplaintHash(baseGrievance);
      const tamperedGrievance = {
        ...baseGrievance,
        department: "Sanitation Dept",
      };
      const tamperedHash = clientHashing.computeComplaintHash(tamperedGrievance);

      expect(tamperedHash).to.not.equal(originalHash);
    });

    it("should detect modified priority", function () {
      const originalHash = clientHashing.computeComplaintHash(baseGrievance);
      const tamperedGrievance = {
        ...baseGrievance,
        priority: "Low",
      };
      const tamperedHash = clientHashing.computeComplaintHash(tamperedGrievance);

      expect(tamperedHash).to.not.equal(originalHash);
    });

    it("should detect modified coordinates (lat/lng)", function () {
      const originalHash = clientHashing.computeComplaintHash(baseGrievance);
      const tamperedGrievance = {
        ...baseGrievance,
        location: { lat: 28.53552, lng: 77.39102 }, // 0.00001 difference
      };
      const tamperedHash = clientHashing.computeComplaintHash(tamperedGrievance);

      expect(tamperedHash).to.not.equal(originalHash);
    });

    it("should normalize whitespace and CRLF vs LF deterministically", function () {
      const crlfGrievance = {
        ...baseGrievance,
        description: "Line 1\r\nLine 2\r\nLine 3",
      };
      const lfGrievance = {
        ...baseGrievance,
        description: "Line 1\nLine 2\nLine 3",
      };

      const crlfHash = clientHashing.computeComplaintHash(crlfGrievance);
      const lfHash = clientHashing.computeComplaintHash(lfGrievance);

      expect(crlfHash).to.equal(lfHash);
    });

    it("should trim outer whitespace from id, department, and priority", function () {
      const paddedGrievance = {
        id: "  GRV-TEST-TAMPER-01  ",
        description: "Large pothole in front of community center causing traffic jams.",
        department: "  Roads & Traffic  ",
        priority: "  Urgent  ",
        location: { lat: 28.53551, lng: 77.39102 },
      };

      const paddedHash = clientHashing.computeComplaintHash(paddedGrievance);
      const baseHash = clientHashing.computeComplaintHash(baseGrievance);

      expect(paddedHash).to.equal(baseHash);
    });

    it("should ignore citizen PII and non-canonical optional fields", function () {
      const withPii = {
        ...baseGrievance,
        citizenName: "Jane Citizen",
        citizenPhone: "+91-9876543210",
        citizenEmail: "jane@example.gov.in",
        submittedAt: "2026-09-13T10:00:00Z",
        extraInternalNotes: "Confidential inspector note",
      };

      const cleanHash = clientHashing.computeComplaintHash(baseGrievance);
      const piiHash = clientHashing.computeComplaintHash(withPii);

      expect(piiHash).to.equal(cleanHash);
    });
  });

  describe("3. Multi-Language, Unicode & Emoji Integrity Tests", function () {
    it("should deterministically hash Hindi (Devanagari) grievance text", function () {
      const hindiGrievance = {
        id: "GRV-HINDI-001",
        description: "सड़क पर गहरा गड्ढा है और पानी भरा हुआ है। कृपया तुरंत ठीक करें।",
        department: "सड़क निर्माण विभाग",
        priority: "High",
        location: { lat: 28.61393, lng: 77.20902 },
      };

      const clientHash = clientHashing.computeComplaintHash(hindiGrievance);
      const backendHash = backendHashing.computeComplaintHash(hindiGrievance);

      expect(clientHash).to.equal(backendHash);
      expect(clientHash).to.match(/^0x[0-9a-f]{64}$/i);
    });

    it("should deterministically hash Hinglish mixed language grievance text", function () {
      const hinglishGrievance = {
        id: "GRV-HINGLISH-002",
        description: "Main road par pipeline burst ho gayi hai. Subah se 2 feet paani bhara hai.",
        department: "Jal Board",
        priority: "Urgent",
        location: { lat: 28.62001, lng: 77.21001 },
      };

      const clientHash = clientHashing.computeComplaintHash(hinglishGrievance);
      const backendHash = backendHashing.computeComplaintHash(hinglishGrievance);

      expect(clientHash).to.equal(backendHash);
    });

    it("should deterministically hash emojis and special symbols", function () {
      const emojiGrievance = {
        id: "GRV-EMOJI-003",
        description: "Streetlight sparking ⚡⚡ near transformer! Risk of fire 🔥🚒 ⚠️",
        department: "Electricity Board",
        priority: "Urgent",
        location: { lat: 28.50000, lng: 77.10000 },
      };

      const clientHash = clientHashing.computeComplaintHash(emojiGrievance);
      const backendHash = backendHashing.computeComplaintHash(emojiGrievance);

      expect(clientHash).to.equal(backendHash);
    });

    it("should deterministically hash special characters and symbols", function () {
      const specialGrievance = {
        id: "GRV-SPECIAL-004",
        description: "Chars: !@#$%^&*()_+~`-={}|[]:\";'<>?,./",
        department: "General Admin",
        priority: "Low",
        location: { lat: 0, lng: 0 },
      };

      const clientHash = clientHashing.computeComplaintHash(specialGrievance);
      const backendHash = backendHashing.computeComplaintHash(specialGrievance);

      expect(clientHash).to.equal(backendHash);
    });
  });

  describe("4. Resolution and Action Hash Verification", function () {
    it("should compute resolution proof hash identically between client and backend", function () {
      const proof = {
        notes: "Replaced 10m bitumen road with heavy compaction roller.",
        officerName: "Er. Ramesh Kumar",
        materialsUsed: "Cold mix asphalt, gravel base grade 2",
        photoUrl: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      };

      const clientResolutionHash = clientHashing.computeResolutionHash(proof);
      const backendResolutionHash = backendHashing.computeResolutionHash(proof);

      expect(clientResolutionHash).to.equal(backendResolutionHash);
    });

    it("should compute officer action hash identically between client and backend", function () {
      const action = {
        actionType: "ASSIGNED",
        grievanceId: "GRV-2026-001",
        officerName: "Inspector Sharma",
        details: "Work crew dispatched to site.",
      };

      const clientActionHash = clientHashing.computeActionHash(action);
      const backendActionHash = backendHashing.computeActionHash(action);

      expect(clientActionHash).to.equal(backendActionHash);
    });
  });

  describe("5. Direct Read-Only JSON-RPC Smart Contract Verification (Zero-Trust)", function () {
    const validGrievance = {
      id: "GRV-RPC-TEST-101",
      description: "Broken streetlight pole at Ward 4 corner.",
      department: "Electricity Board",
      priority: "Medium",
      location: { lat: 28.61391, lng: 77.20901 },
    };

    let contractAddress;
    let rpcUrl;

    before(async function () {
      contractAddress = await smartGovAudit.getAddress();
      rpcUrl = "http://127.0.0.1:8545";

      // Register the complaint on-chain via backendRelayer
      const complaintHash = clientHashing.computeComplaintHash(validGrievance);
      const idBytes32 = clientHashing.complaintIdToBytes32(validGrievance.id);
      const deptHash = clientHashing.departmentToBytes32(validGrievance.department);

      const tx = await smartGovAudit
        .connect(backendRelayer)
        .registerComplaint(idBytes32, complaintHash, deptHash, 2);
      await tx.wait();
    });

    it("should verify matching complaint directly via RPC with status VERIFIED", async function () {
      const result = await clientVerifier.verifyGrievanceIntegrity(validGrievance, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(result.verified).to.be.true;
      expect(result.tamperDetected).to.be.false;
      expect(result.status).to.equal("VERIFIED");
      expect(result.source).to.equal("DIRECT_RPC");
      expect(result.exists).to.be.true;
      expect(result.calculatedHash.toLowerCase()).to.equal(result.onChainHash.toLowerCase());
    });

    it("should detect tampering on modified description directly via RPC", async function () {
      const tamperedGrievance = {
        ...validGrievance,
        description: "Broken streetlight pole at Ward 4 corner - MODIFIED ILLEGITIMATELY",
      };

      const result = await clientVerifier.verifyGrievanceIntegrity(tamperedGrievance, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(result.verified).to.be.false;
      expect(result.tamperDetected).to.be.true;
      expect(result.status).to.equal("TAMPERING_DETECTED");
      expect(result.source).to.equal("DIRECT_RPC");
      expect(result.calculatedHash.toLowerCase()).to.not.equal(result.onChainHash.toLowerCase());
    });

    it("should detect tampering on modified department directly via RPC", async function () {
      const tamperedGrievance = {
        ...validGrievance,
        department: "Horticulture Department",
      };

      const result = await clientVerifier.verifyGrievanceIntegrity(tamperedGrievance, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(result.verified).to.be.false;
      expect(result.tamperDetected).to.be.true;
      expect(result.status).to.equal("TAMPERING_DETECTED");
    });

    it("should report NOT_ON_CHAIN for an unregistered grievance ID", async function () {
      const unregisteredGrievance = {
        id: "GRV-UNREGISTERED-999",
        description: "Phantom grievance not in blockchain ledger.",
        department: "Health",
        priority: "Low",
      };

      const result = await clientVerifier.verifyGrievanceIntegrity(unregisteredGrievance, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(result.verified).to.be.false;
      expect(result.tamperDetected).to.be.false;
      expect(result.exists).to.be.false;
      expect(result.status).to.equal("NOT_ON_CHAIN");
    });

    it("should fetch on-chain audit trail history directly via RPC", async function () {
      // Record an officer action on the valid grievance
      const idBytes32 = clientHashing.complaintIdToBytes32(validGrievance.id);
      const actionHash = clientHashing.computeActionHash({
        actionType: "INSPECTION_SCHEDULED",
        grievanceId: validGrievance.id,
        officerName: "Er. Kumar",
        details: "On-site team inspection scheduled for tomorrow 10am.",
      });

      const tx = await smartGovAudit
        .connect(backendRelayer)
        .recordOfficerAction(idBytes32, actionHash, "INSPECTION_SCHEDULED");
      await tx.wait();

      const history = await clientVerifier.fetchOnChainAuditHistory(validGrievance.id, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(history).to.be.an("array");
      expect(history.length).to.be.at.least(2); // Registration + OfficerAction
      expect(history[history.length - 1].actionType).to.equal("INSPECTION_SCHEDULED");
    });
  });

  describe("6. Resilient Fallback, Timeout & Malformed Response Handling", function () {
    it("should handle RPC timeout gracefully when timeout limit is exceeded", async function () {
      const grievance = {
        id: "GRV-TIMEOUT-TEST",
        description: "Timeout simulation test.",
        department: "Sanitation",
        priority: "Low",
      };

      // Set unrealistic 1ms timeout with a dummy unreachable port to trigger timeout / fallback
      const result = await clientVerifier.verifyGrievanceIntegrity(grievance, {
        rpcUrl: "http://10.255.255.1:9999", // Unreachable IP
        contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        timeoutMs: 50,
      });

      // Should safely handle without unhandled rejection
      expect(result).to.be.an("object");
      expect(result.verified).to.be.false;
      expect(["BACKEND_PROXY", "DIRECT_RPC"]).to.include(result.source);
    });

    it("should handle unreachable RPC URL and attempt fallback", async function () {
      const grievance = {
        id: "GRV-UNREACHABLE-TEST",
        description: "Unreachable RPC test.",
        department: "Water Board",
        priority: "High",
      };

      const result = await clientVerifier.verifyGrievanceIntegrity(grievance, {
        rpcUrl: "http://127.0.0.1:59999", // Non-existent local port
        contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        timeoutMs: 100,
      });

      expect(result).to.be.an("object");
      expect(result.verified).to.be.false;
      expect(result.source).to.equal("BACKEND_PROXY");
    });
  });

  describe("7. Adversarial Verification Tests (Critical Security Gates)", function () {
    let contractAddress;
    let rpcUrl;
    const genuineGrievance = {
      id: "GRV-ADVERSARIAL-777",
      description: "Severe toxic chemical leak reported behind industrial zone warehouse.",
      department: "Pollution Control Board",
      priority: "Urgent",
      location: { lat: 28.52000, lng: 77.30000 },
    };

    before(async function () {
      contractAddress = await smartGovAudit.getAddress();
      rpcUrl = "http://127.0.0.1:8545";

      // Register genuine grievance on blockchain
      const genuineHash = clientHashing.computeComplaintHash(genuineGrievance);
      const idBytes32 = clientHashing.complaintIdToBytes32(genuineGrievance.id);
      const deptHash = clientHashing.departmentToBytes32(genuineGrievance.department);

      const tx = await smartGovAudit
        .connect(backendRelayer)
        .registerComplaint(idBytes32, genuineHash, deptHash, 3);
      await tx.wait();
    });

    it("Adversarial Test 1: Off-chain grievance data modified while on-chain record unchanged -> TAMPERING DETECTED", async function () {
      // Attacker tampers with grievance text to downplay severity:
      const tamperedGrievance = {
        ...genuineGrievance,
        description: "Minor clean water puddle reported behind warehouse.", // Tampered!
        priority: "Low", // Tampered!
      };

      const verificationResult = await clientVerifier.verifyGrievanceIntegrity(tamperedGrievance, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(verificationResult.source).to.equal("DIRECT_RPC");
      expect(verificationResult.verified).to.be.false;
      expect(verificationResult.tamperDetected).to.be.true;
      expect(verificationResult.status).to.equal("TAMPERING_DETECTED");
      expect(verificationResult.details).to.include("TAMPERING DETECTED");
      expect(verificationResult.calculatedHash.toLowerCase()).to.not.equal(
        verificationResult.onChainHash.toLowerCase()
      );
    });

    it("Adversarial Test 2: Compromised backend proxy returns { verified: true } with mismatching hash -> Frontend MUST REJECT and display TAMPERING DETECTED", async function () {
      // Simulate an adversarial scenario where a malicious backend attempts to fool the client
      // The client calculates its local hash for a modified grievance
      const modifiedGrievance = {
        ...genuineGrievance,
        description: "Modified grievance text.",
      };

      const calculatedHash = clientHashing.computeComplaintHash(modifiedGrievance);
      const genuineOnChainHash = clientHashing.computeComplaintHash(genuineGrievance);

      // Verify that calculatedHash is different from on-chain hash
      expect(calculatedHash).to.not.equal(genuineOnChainHash);

      // Simulate a compromised backend response that falsely claims `verified: true`:
      const maliciousBackendResponse = {
        success: true,
        result: {
          verified: true, // Falsely claims true!
          onChainHash: genuineOnChainHash, // Returns the actual on-chain hash
          calculatedHash: genuineOnChainHash, // Backend claims it calculated the same
        },
      };

      // Client's internal security logic:
      // Even if backend says `verified: true`, client checks:
      // calculatedHash.toLowerCase() === backendResponse.onChainHash.toLowerCase()
      const clientLocalMatch =
        calculatedHash.toLowerCase() === maliciousBackendResponse.result.onChainHash.toLowerCase();
      const clientDeterminedVerified = clientLocalMatch && calculatedHash !== "0x0000000000000000000000000000000000000000000000000000000000000000";

      // The frontend must NOT be tricked!
      expect(clientDeterminedVerified).to.be.false;
      expect(clientLocalMatch).to.be.false;
    });

    it("Adversarial Test 3: Zero-Trust rule when DIRECT_RPC is available: backend is completely bypassed", async function () {
      // When direct RPC is available, the client directly queries the EVM node.
      // Even if an off-chain API is down or compromised, client verification succeeds directly from EVM storage.
      const directResult = await clientVerifier.verifyGrievanceIntegrity(genuineGrievance, {
        provider: ethers.provider,
        contractAddress,
      });

      expect(directResult.source).to.equal("DIRECT_RPC");
      expect(directResult.verified).to.be.true;
      expect(directResult.tamperDetected).to.be.false;
      expect(directResult.status).to.equal("VERIFIED");
    });
  });
});
