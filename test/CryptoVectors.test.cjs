const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 1 Cryptographic Vectors & Cross-Implementation Parity", function () {
  let backendHashing;
  let clientHashing;
  let smartGovAudit;
  let deployer;
  let relayer;

  before(async function () {
    [deployer, relayer] = await ethers.getSigners();

    backendHashing = await import("../server/services/blockchain/hashing.ts");
    clientHashing = await import("../src/utils/clientHashing.ts");

    const SmartGovAuditFactory = await ethers.getContractFactory("SmartGovAudit");
    smartGovAudit = await SmartGovAuditFactory.deploy(deployer.address, relayer.address);
    await smartGovAudit.waitForDeployment();
  });

  describe("1. Standard NIST & EVM Keccak-256 Test Vectors", function () {
    it("should match NIST vector for empty input ''", function () {
      const expected = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
      expect(backendHashing.keccak256("")).to.equal(expected);
      expect(clientHashing.keccak256("")).to.equal(expected);
      expect(ethers.keccak256(ethers.toUtf8Bytes(""))).to.equal(expected);
    });

    it("should match NIST vector for 'abc'", function () {
      const expected = "0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45";
      expect(backendHashing.keccak256("abc")).to.equal(expected);
      expect(clientHashing.keccak256("abc")).to.equal(expected);
      expect(ethers.keccak256(ethers.toUtf8Bytes("abc"))).to.equal(expected);
    });

    it("should match NIST vector for 'The quick brown fox jumps over the lazy dog'", function () {
      const input = "The quick brown fox jumps over the lazy dog";
      const expected = "0x4d741b6f1eb29cb2a9b9911c82f56fa8d73b04959d3d9d222895df6c0b28aa15";
      expect(backendHashing.keccak256(input)).to.equal(expected);
      expect(clientHashing.keccak256(input)).to.equal(expected);
      expect(ethers.keccak256(ethers.toUtf8Bytes(input))).to.equal(expected);
    });

    it("should match NIST vector for 'The quick brown fox jumps over the lazy dog.' (period)", function () {
      const input = "The quick brown fox jumps over the lazy dog.";
      const expected = "0x578951e24efd62a3d63a86f7cd19aaa53c898fe287d2552133220370240b572d";
      expect(backendHashing.keccak256(input)).to.equal(expected);
      expect(clientHashing.keccak256(input)).to.equal(expected);
      expect(ethers.keccak256(ethers.toUtf8Bytes(input))).to.equal(expected);
    });
  });

  describe("2. Canonical JSON Serialization & Lexicographical Ordering", function () {
    it("should sort top-level and nested keys in lexicographical order regardless of insertion", function () {
      const objA = { z: 1, a: 2, m: { y: "test", b: 100 } };
      const objB = { a: 2, m: { b: 100, y: "test" }, z: 1 };

      const canonA = backendHashing.canonicalizeJson(objA);
      const canonB = backendHashing.canonicalizeJson(objB);
      const clientCanon = clientHashing.canonicalizeJson(objA);

      expect(canonA).to.equal('{"a":2,"m":{"b":100,"y":"test"},"z":1}');
      expect(canonA).to.equal(canonB);
      expect(canonA).to.equal(clientCanon);
    });

    it("should correctly handle null, undefined, boolean, and empty collections", function () {
      const complex = {
        emptyObj: {},
        emptyArr: [],
        nullVal: null,
        boolTrue: true,
        boolFalse: false,
        numZero: 0,
      };

      const backendStr = backendHashing.canonicalizeJson(complex);
      const clientStr = clientHashing.canonicalizeJson(complex);

      expect(backendStr).to.equal(clientStr);
      expect(backendStr).to.equal(
        '{"boolFalse":false,"boolTrue":true,"emptyArr":[],"emptyObj":{},"nullVal":null,"numZero":0}'
      );
    });
  });

  describe("3. Domain Separation & Versioning Enforcements", function () {
    it("should export matching domain separation prefixes across backend and client", function () {
      expect(backendHashing.COMPLAINT_DOMAIN_PREFIX).to.equal("SMARTGOV:COMPLAINT:v1:");
      expect(clientHashing.COMPLAINT_DOMAIN_PREFIX).to.equal("SMARTGOV:COMPLAINT:v1:");

      expect(backendHashing.RESOLUTION_DOMAIN_PREFIX).to.equal("SMARTGOV:RESOLUTION:v1:");
      expect(clientHashing.RESOLUTION_DOMAIN_PREFIX).to.equal("SMARTGOV:RESOLUTION:v1:");

      expect(backendHashing.ACTION_DOMAIN_PREFIX).to.equal("SMARTGOV:ACTION:v1:");
      expect(clientHashing.ACTION_DOMAIN_PREFIX).to.equal("SMARTGOV:ACTION:v1:");
    });

    it("should prevent cross-domain hash collisions even if fields are identical", function () {
      const testPayload = {
        id: "GRV-COLLISION-TEST",
        description: "Shared text content",
        department: "Sanitation",
        priority: "High",
      };

      const complaintHash = backendHashing.computeComplaintHash(testPayload);
      const actionHash = backendHashing.computeActionHash({
        actionType: "TEST",
        grievanceId: testPayload.id,
        details: testPayload.description,
      });

      expect(complaintHash).to.not.equal(actionHash);
      expect(complaintHash.startsWith("0x")).to.be.true;
      expect(complaintHash.length).to.equal(66);
    });
  });

  describe("4. Multilingual & Unicode Robustness (Hindi, Hinglish, Emojis)", function () {
    it("should produce identical hashes for pure Hindi Devanagari complaints", function () {
      const hindiGrievance = {
        id: "GRV-HINDI-001",
        description: "मुख्य मार्ग पर सीवर का पानी ओवरफ्लो हो रहा है और भारी बदबू आ रही है।",
        department: "जल एवं स्वच्छता विभाग",
        priority: "Urgent",
        location: { lat: 28.613939, lng: 77.209021 },
      };

      const backendHash = backendHashing.computeComplaintHash(hindiGrievance);
      const clientHash = clientHashing.computeComplaintHash(hindiGrievance);

      expect(backendHash).to.equal(clientHash);
      expect(backendHash.length).to.equal(66);
    });

    it("should produce identical hashes for Hinglish mixed text", function () {
      const hinglishGrievance = {
        id: "GRV-HINGLISH-002",
        description: "Main road pe bada pot hole hai, accident ka danger hai please jaldi fix karo",
        department: "Public Works Department",
        priority: "High",
        location: { lat: 28.535517, lng: 77.391026 },
      };

      const backendHash = backendHashing.computeComplaintHash(hinglishGrievance);
      const clientHash = clientHashing.computeComplaintHash(hinglishGrievance);

      expect(backendHash).to.equal(clientHash);
    });

    it("should produce identical hashes for complaints with emojis and special symbols", function () {
      const emojiGrievance = {
        id: "GRV-EMOJI-003",
        description: "Emergency: Fire hydrant broken! 🚒 🚨 💦 Water everywhere @ Sector 14",
        department: "Fire & Emergency Services",
        priority: "Urgent",
        location: { lat: 28.704059, lng: 77.10249 },
      };

      const backendHash = backendHashing.computeComplaintHash(emojiGrievance);
      const clientHash = clientHashing.computeComplaintHash(emojiGrievance);

      expect(backendHash).to.equal(clientHash);
    });
  });

  describe("5. Whitespace & Normalization Invariants", function () {
    it("should produce identical hashes regardless of CRLF vs LF line endings", function () {
      const crlf = {
        id: "GRV-NORM-001",
        description: "Line 1\r\nLine 2\r\nLine 3",
        department: "Sanitation",
        priority: "General",
      };
      const lf = {
        id: "GRV-NORM-001",
        description: "Line 1\nLine 2\nLine 3",
        department: "Sanitation",
        priority: "General",
      };

      expect(backendHashing.computeComplaintHash(crlf)).to.equal(
        clientHashing.computeComplaintHash(lf)
      );
    });

    it("should normalize coordinate precision to 5 decimal places (~1.1 meter)", function () {
      const highPrec = {
        id: "GRV-COORD-001",
        description: "Streetlight repair",
        department: "Electricity",
        priority: "Low",
        location: { lat: 28.123456789, lng: 77.987654321 },
      };
      const rounded = {
        id: "GRV-COORD-001",
        description: "Streetlight repair",
        department: "Electricity",
        priority: "Low",
        location: { lat: 28.12346, lng: 77.98765 },
      };

      expect(backendHashing.computeComplaintHash(highPrec)).to.equal(
        clientHashing.computeComplaintHash(rounded)
      );
    });
  });

  describe("6. On-Chain Solidity Verification with Domain Separation", function () {
    it("should register grievance hashed with domain prefix and successfully verify on-chain", async function () {
      const grievance = {
        id: "GRV-CHAIN-VERIFY-001",
        description: "Broken stormwater drain outside Community Center",
        department: "Municipal Corporation",
        priority: "High",
        location: { lat: 28.6139, lng: 77.209 },
      };

      const complaintHash = backendHashing.computeComplaintHash(grievance);
      const idBytes32 = backendHashing.complaintIdToBytes32(grievance.id);
      const deptBytes32 = backendHashing.departmentToBytes32(grievance.department);

      // Register on contract
      await smartGovAudit.connect(relayer).registerComplaint(
        idBytes32,
        complaintHash,
        deptBytes32,
        3 // High
      );

      // Verify on-chain via smart contract view function
      const isValid = await smartGovAudit.verifyComplaint(idBytes32, complaintHash);
      expect(isValid).to.be.true;

      // Verify tampering is rejected
      const tamperedGrievance = { ...grievance, description: "Drain was already repaired" };
      const tamperedHash = clientHashing.computeComplaintHash(tamperedGrievance);
      const isTamperedValid = await smartGovAudit.verifyComplaint(idBytes32, tamperedHash);
      expect(isTamperedValid).to.be.false;
    });

    it("should verify resolution proofs with domain prefix on-chain", async function () {
      const proof = {
        notes: "Replaced 50m damaged drainage pipe with heavy-duty concrete conduit",
        officerName: "Inspector Rajesh Kumar",
        materialsUsed: "50m Concrete Pipe, 20 bags cement",
        photoUrl: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      };

      const idBytes32 = backendHashing.complaintIdToBytes32("GRV-CHAIN-VERIFY-001");
      const resolutionHash = backendHashing.computeResolutionHash(proof);
      const actionHash = backendHashing.computeActionHash({
        actionType: "RESOLUTION",
        grievanceId: "GRV-CHAIN-VERIFY-001",
        details: proof.notes,
        officerName: proof.officerName,
      });

      // Certify resolution on contract
      await smartGovAudit.connect(relayer).recordResolution(idBytes32, resolutionHash, actionHash);

      // Verify on-chain
      const clientResolutionHash = clientHashing.computeResolutionHash(proof);
      expect(clientResolutionHash).to.equal(resolutionHash);

      const isValidRes = await smartGovAudit.verifyResolution(idBytes32, clientResolutionHash);
      expect(isValidRes).to.be.true;

      // Tampered proof must fail
      const tamperedProof = { ...proof, notes: "Changed text after certification" };
      const tamperedResHash = clientHashing.computeResolutionHash(tamperedProof);
      const isTamperedValid = await smartGovAudit.verifyResolution(idBytes32, tamperedResHash);
      expect(isTamperedValid).to.be.false;
    });
  });
});
