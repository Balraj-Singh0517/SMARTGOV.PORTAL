# SmartGov Portal

## Intelligent AI-Based Grievance Routing & Blockchain-Backed Civic Intelligence Platform

SmartGov Portal is an intelligent public-grievance management platform designed to transform how citizens report civic problems and how government departments receive, prioritize, route, monitor, and resolve them.

The platform combines **AI/NLP-based grievance understanding**, **deterministic municipal routing**, **duplicate detection**, **geospatial context**, **real-time officer workflows**, and a **privacy-preserving EVM blockchain audit layer**.

The core design principle is:

> **AI decides how a grievance should be understood and routed; the application manages the operational workflow; blockchain provides a tamper-evident integrity layer for critical lifecycle records.**

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Key Capabilities](#key-capabilities)
- [AI/ML Architecture](#aiml-architecture)
- [AI Pipeline](#ai-pipeline)
- [NLP & Language Intelligence](#nlp--language-intelligence)
- [Intelligent Department Routing](#intelligent-department-routing)
- [Priority & Risk Analysis](#priority--risk-analysis)
- [Duplicate Grievance Detection](#duplicate-grievance-detection)
- [Entity Extraction](#entity-extraction)
- [Blockchain Integrity Layer](#blockchain-integrity-layer)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Security & Privacy](#security--privacy)
- [Testing & Validation](#testing--validation)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Development](#development)
- [Production Build](#production-build)
- [AI/ML Design Decisions](#aiml-design-decisions)
- [Limitations](#limitations)
- [Future ML Roadmap](#future-ml-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

# Problem Statement

Traditional public grievance systems frequently depend on manual categorization and routing.

A citizen may submit:

> "Kal raat se market ke paas street light band hai, bahut andhera hai aur accident ka risk hai."

A conventional workflow may require a human operator to:

1. Read the complaint.
2. Understand the language.
3. Translate it.
4. Identify the civic issue.
5. Determine the responsible department.
6. Estimate urgency.
7. Find similar complaints.
8. Forward it to an officer.
9. Track the resolution.
10. Verify the resolution evidence.

This creates delays, inconsistent routing, duplicate workloads, and weak auditability.

SmartGov automates this pipeline.

---

# Solution

SmartGov converts unstructured citizen complaints into structured civic intelligence.

```text
Citizen Complaint
       |
       v
Language & Context Understanding
       |
       v
Translation / Normalization
       |
       v
Entity Extraction
       |
       v
Department Classification
       |
       v
Priority & Risk Assessment
       |
       v
Duplicate / Similarity Detection
       |
       v
Geographic Context
       |
       v
Department Routing
       |
       v
Officer Workflow
       |
       v
Resolution Evidence
       |
       v
Cryptographic Integrity Record
       |
       v
EVM Blockchain Audit Layer
```

---

# Key Capabilities

### Citizen Intelligence

- Natural-language grievance submission
- English, Hindi, and Hinglish support
- Automatic language detection
- English translation/context normalization
- AI-generated grievance title
- Civic entity extraction
- Location-aware complaint context
- Priority and urgency assessment
- Similar grievance detection

### Government Operations

- Department-specific routing
- Officer inbox
- Complaint status lifecycle
- Transfer workflow
- Official replies
- Resolution proof submission
- Resolution timeline
- Department analytics
- Officer workload monitoring
- Real-time WebSocket updates

### Integrity & Auditability

- Deterministic complaint hashing
- Deterministic officer-action hashing
- Deterministic resolution hashing
- EVM-compatible Keccak-256
- Domain-separated cryptographic commitments
- Smart-contract state enforcement
- Role-based blockchain permissions
- Durable transaction queue
- Nonce synchronization
- Restart reconciliation
- Client-side direct RPC verification
- Tamper detection
- No citizen PII stored on-chain

---

# AI/ML Architecture

SmartGov uses a hybrid AI architecture.

```text
                    Citizen Input
                         |
                         v
              +----------------------+
              | Language Detection   |
              +----------------------+
                         |
                         v
              +----------------------+
              | Context Understanding|
              +----------------------+
                         |
              +----------+----------+
              |                     |
              v                     v
       Gemini AI Analysis     Deterministic Fallback
              |                     |
              +----------+----------+
                         |
                         v
              Structured AI Result
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
   Department        Priority         Entities
   Classification     / Risk          / Context
        |                |                |
        +----------------+----------------+
                         |
                         v
                 Routing Decision
```

The system is intentionally designed with a fallback path so that grievance intake does not completely depend on a remote generative model.

## AI Provider

The current implementation integrates Google's Gemini API through:

```text
@google/genai
```

The backend initializes the AI client lazily using `GEMINI_API_KEY`.

If the key is unavailable, the system can fall back to deterministic rule-based civic classification.

---

# AI Pipeline

Each grievance can be represented as a structured object containing:

```text
description
detectedLanguage
englishTranslation
title
department
confidenceScore
priority
urgencyLevel
sentiment
entities
location
similarGrievance
routingRationale
```

The AI output is therefore not treated as an opaque paragraph.

It becomes structured machine-readable civic intelligence.

Example:

```json
{
  "detectedLanguage": "Hindi / Hinglish",
  "recommendedDepartment": "Public Works (Power)",
  "confidenceScore": 96,
  "priority": "High",
  "urgencyLevel": "High Risk",
  "tone": "Anxious",
  "extractedEntities": [
    "Street Light",
    "Power Grid",
    "Accident Risk"
  ]
}
```

---

# NLP & Language Intelligence

SmartGov is designed for real-world Indian civic communication, where citizens may mix English, Hindi, and transliterated Hindi.

Examples:

```text
"Street light band hai"
"Road par gaddha hai"
"Paani ki pipeline burst ho gayi"
"Kooda bahut jama hai"
"Bijli ka pole dangerous hai"
```

The pipeline recognizes:

- English
- Hindi
- Hinglish
- Hindi Devanagari
- mixed-language civic terminology

The system extracts language and contextual signals before routing.

---

# Intelligent Department Routing

Routing is treated as a classification problem with a strict operational constraint:

> **A grievance should have one primary responsible department.**

This avoids ambiguous multi-department routing.

Example:

```text
Input:
"Street light band hai aur raat ko accident ka risk hai."

AI interpretation:
    Issue = electrical/public illumination
    Risk = public safety
    Department = Public Works (Power)
    Priority = High
    Urgency = High Risk
```

The current deterministic fallback uses domain-specific civic vocabulary and hazard-first evaluation.

Examples:

| Signal | Primary Department |
|---|---|
| Street light, electricity, pole, transformer | Public Works / Power |
| Pipeline, water leakage, water supply | Water Board |
| Road, pothole, bridge, divider | Roads & Bridges |
| Garbage, waste, sanitation | Sanitation |
| Park, tree, playground | Parks & Horticulture |

---

# Priority & Risk Analysis

The system distinguishes between normal classification and operational risk.

Priority levels:

```text
Urgent
High
General
Low
```

Risk levels:

```text
High Risk
Moderate
Low
```

Hazard indicators such as:

- accident
- injury
- electrical shock
- flooding
- severe blockage
- emergency
- dangerous infrastructure

can increase operational priority.

This allows the system to optimize not only for:

> "What department owns this problem?"

but also:

> "How quickly should this problem receive attention?"

---

# Duplicate Grievance Detection

Duplicate detection prevents multiple citizens reporting the same underlying civic incident from creating unnecessary operational fragmentation.

The system can surface similar complaints with:

```text
similar grievance ID
match percentage
title
description
supporters
current status
```

Importantly:

> **Similarity detection should not automatically delete or suppress legitimate citizen submissions.**

The recommended architecture treats similarity as decision-support rather than destructive filtering.

---

# Entity Extraction

Entities provide structured context for downstream routing and analytics.

Examples:

```text
Central Market
Street Light
Night Outage
Accident Risk
Pipeline
Traffic Congestion
Garbage Dump
Sector 42
Ring Road
```

These entities can support:

- department classification
- location interpretation
- priority detection
- duplicate detection
- analytics
- officer triage

---

# Blockchain Integrity Layer

The blockchain layer is designed as an **audit and integrity layer**, not as the primary application database.

Large or sensitive information remains off-chain.

## On-chain

Only minimal integrity metadata is committed:

```text
complaintId
complaintHash
department identifier
priority
status
timestamp
officerActionHash
resolutionHash
```

## Off-chain

The application retains:

```text
citizen information
complaint text
photos
documents
AI analysis
officer notes
large media
```

This provides privacy while still allowing independent integrity verification.

---

# Four-Phase Blockchain Architecture

## Phase 1 — Cryptographic Foundation

The system uses:

- deterministic lexicographical JSON canonicalization
- EVM-compatible Keccak-256
- versioned domain separation
- normalized coordinate precision
- cross-client/backend hash compatibility

Domains:

```text
SMARTGOV:COMPLAINT:v1:
SMARTGOV:ACTION:v1:
SMARTGOV:RESOLUTION:v1:
```

This prevents different record types from unintentionally sharing the same cryptographic domain.

---

## Phase 2 — Smart Contract

The SmartGov audit contract enforces the grievance lifecycle on-chain.

Example state machine:

```text
Open
  |
  v
InProgress
  |
  v
Transferred
  |
  v
Resolved
  |
  v
Closed
```

The contract enforces:

- legal state transitions
- terminal-state locking
- duplicate protection
- role separation
- resolution locking
- pause/circuit-breaker controls
- event emission

Example roles:

```text
DEFAULT_ADMIN_ROLE
BACKEND_ROLE
AUDITOR_ROLE
```

The backend relayer is deliberately separated from administrative control.

---

## Phase 3 — Transaction Reliability

Blockchain transactions are not assumed to succeed simply because the backend process is alive.

The transaction layer uses:

```text
Durable Queue
      |
      v
Nonce Manager
      |
      v
RPC Submission
      |
      v
Confirmation Tracking
      |
      v
Reconciliation
```

Transaction states include:

```text
QUEUED
PENDING
CONFIRMED
FAILED
```

The infrastructure includes:

- durable queue persistence
- sequential nonce management
- async mutex
- retry handling
- restart recovery
- blockchain reconciliation
- dead-letter handling
- WebSocket confirmation events

---

# Phase 4 — Zero-Trust Client Verification

The browser can independently verify the integrity of a grievance.

```text
Off-chain Record
       |
       v
Local Hash
       |
       v
Direct JSON-RPC eth_call
       |
       v
On-chain Commitment
       |
       v
Comparison
       |
       +----------+
       |          |
       v          v
    MATCH     MISMATCH
       |          |
       v          v
   VERIFIED   TAMPERING
              DETECTED
```

The browser does not require a wallet merely to perform read-only verification.

Verification states should distinguish:

```text
VERIFIED
MISMATCH
NOT_REGISTERED
PENDING
BLOCKCHAIN_UNAVAILABLE
INVALID_DATA
```

This prevents the UI from incorrectly presenting an unavailable verification as a successful verification.

---

# System Architecture

```text
                    +----------------------+
                    |      CITIZEN         |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |   React Frontend     |
                    +----------+-----------+
                               |
                    REST / WebSocket
                               |
                               v
                    +----------------------+
                    | Express Backend      |
                    +----------+-----------+
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
      +---------------+                 +----------------+
      | AI/NLP Layer  |                 | Grievance DB   |
      | Gemini +      |                 | / App State    |
      | fallback     |                 +----------------+
      +-------+-------+
              |
              v
      Structured AI Result
              |
              v
      Routing / Priority
              |
              v
      +----------------------+
      | Blockchain Service   |
      +----------+-----------+
                 |
        +--------+---------+
        |                  |
        v                  v
 Transaction Queue     Hashing Layer
        |                  |
        +--------+---------+
                 |
                 v
         EVM Smart Contract
                 |
                 v
        Immutable Commitment
                 ^
                 |
        Direct RPC Verification
                 |
                 ^
        +--------+---------+
        | Browser Verifier |
        +------------------+
```

---

# Technology Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Leaflet
- Motion

## Backend

- Node.js
- Express
- TypeScript
- WebSocket (`ws`)
- dotenv

## AI / NLP

- Google Gemini API
- `@google/genai`
- deterministic rule-based fallback
- structured AI output

## Blockchain

- Solidity
- EVM-compatible network
- OpenZeppelin security primitives where applicable
- EVM Keccak-256
- JSON-RPC
- `eth_call`
- role-based access control
- durable transaction infrastructure

## Development

- TypeScript
- Vite
- esbuild
- npm/bun-compatible dependency workflow

---

# Project Structure

```text
SMARTGOV.PORTAL/
│
├── public/
│   └── smart-gov-logo.jpg
│
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── AnalyticsView.tsx
│   │   ├── DepartmentsView.tsx
│   │   ├── FileGrievanceView.tsx
│   │   ├── OfficerInboxDetailView.tsx
│   │   ├── ResolutionProofModal.tsx
│   │   ├── TransferModal.tsx
│   │   └── ...
│   │
│   ├── context/
│   │   ├── LanguageContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── WebSocketContext.tsx
│   │
│   ├── data/
│   │   └── mockData.ts
│   │
│   ├── utils/
│   │   ├── locationService.ts
│   │   └── translations.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── types.ts
│
├── server.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── docs/
    └── BLOCKCHAIN_ARCHITECTURE.md
```

For the blockchain-enabled branch, additional blockchain-specific modules include the hashing, contract, transaction-management, reconciliation, and client-verification components described in the blockchain architecture documentation.

---

# Data Flow

## Complaint Creation

```text
Citizen enters complaint
        |
        v
Language/context analysis
        |
        v
AI classification
        |
        v
Department + priority + entities
        |
        v
Similar grievance check
        |
        v
Complaint persisted
        |
        v
Cryptographic commitment
        |
        v
Blockchain transaction
```

## Officer Resolution

```text
Officer opens grievance
        |
        v
Status update
        |
        v
Officer action hash
        |
        v
Blockchain commitment
        |
        v
Resolution proof
        |
        v
Resolution hash
        |
        v
Blockchain commitment
        |
        v
Closed state
```

---

# Security & Privacy

SmartGov follows a hybrid trust model.

## Zero PII on Blockchain

Citizen PII should remain off-chain.

Do not store:

```text
Name
Phone
Email
Home address
Complaint text
Government ID
Photos
Documents
```

on the blockchain.

Instead, commit cryptographic digests and minimal identifiers.

## Private Keys

Blockchain signing credentials must exist only on the trusted backend.

They must never be included in:

```text
Frontend source
Browser bundle
Public environment variables
Client-side JavaScript
```

## Defense in Depth

Security does not depend on blockchain alone.

The system combines:

```text
Authentication
+
Authorization
+
Input validation
+
AI controls
+
Application security
+
Cryptographic commitments
+
Smart-contract enforcement
+
Transaction reliability
+
Independent verification
```

---

# Testing & Validation

The blockchain-enabled implementation is designed around automated validation across all four phases.

Reported validation target:

```text
135 tests passing
0 tests failing
```

Representative test groups:

```text
SmartGovAudit.test.cjs
TransactionQueue.test.cjs
ClientVerification.test.cjs
Phase4EndToEndAdversarial.test.cjs
CryptoVectors.test.cjs
```

Adversarial scenarios include:

- modified complaint data
- modified resolution data
- modified action data
- invalid lifecycle transition
- unauthorized role
- duplicate operation
- terminal-state mutation
- transaction failure
- RPC failure
- queue recovery
- cryptographic mismatch
- verification failure

The authoritative test result should always be generated from the current repository rather than copied from historical documentation.

---

# Environment Variables

Create a local `.env` based on `.env.example`.

Typical configuration includes:

```env
GEMINI_API_KEY=
BLOCKCHAIN_RPC_URL=
BLOCKCHAIN_CHAIN_ID=
SMARTGOV_CONTRACT_ADDRESS=
BLOCKCHAIN_PRIVATE_KEY=
BLOCKCHAIN_CONFIRMATIONS=
BLOCKCHAIN_TX_TIMEOUT=
```

### Important

Blockchain private keys are **server-only secrets**.

Never prefix private keys with frontend exposure prefixes such as:

```text
VITE_
NEXT_PUBLIC_
REACT_APP_
```

Never commit `.env` or real credentials.

---

# Installation

Clone the repository:

```bash
git clone <repository-url>
cd SMARTGOV.PORTAL
```

Install dependencies:

```bash
npm install
```

or:

```bash
bun install
```

Configure environment variables:

```bash
cp .env.example .env
```

Add the required Gemini and blockchain configuration.

---

# Development

Start the application:

```bash
npm run dev
```

The development server starts the application backend and frontend workflow defined by the repository.

---

# Lint / Type Check

Run:

```bash
npm run lint
```

The command performs TypeScript validation through:

```text
tsc --noEmit
```

---

# Production Build

Run:

```bash
npm run build
```

This produces the optimized frontend and bundled backend.

Start the production server:

```bash
npm start
```

---

# AI/ML Design Decisions

## Why use a hybrid AI architecture?

Generative AI provides flexible natural-language understanding, especially for:

- Hinglish
- mixed-language input
- contextual interpretation
- nuanced civic descriptions

A deterministic fallback provides:

- predictable behavior
- lower operational dependency
- explainable routing
- graceful degradation

This is particularly important in civic infrastructure, where failure of an external AI service should not necessarily prevent citizens from registering grievances.

---

## Why structured outputs?

Free-form AI responses are difficult to validate and route reliably.

SmartGov instead converts AI output into structured fields:

```text
department
priority
urgency
entities
confidence
translation
title
routing rationale
```

This allows downstream services to validate and consume AI results.

---

## Why confidence scores?

Confidence provides an operational signal for human review and analytics.

It should not be interpreted as a mathematical guarantee of correctness.

A future production implementation should calibrate confidence using a labeled validation dataset.

---

## Why not automatically delete duplicates?

Two complaints can be similar but still represent legitimate independent reports.

Therefore:

```text
Similarity ≠ Duplicate Truth
```

The system should surface similar grievances to users/officers instead of silently destroying citizen submissions.

---

# Limitations

SmartGov is an advanced prototype architecture and still has important production considerations.

### AI

- A generative model can produce incorrect classifications.
- Confidence scores require calibration against real labeled data.
- Rule-based fallback is deterministic but not equivalent to a trained ML classifier.
- Production deployment should include model evaluation and drift monitoring.

### Data

A production ML system requires a representative, labeled grievance dataset covering:

- departments
- languages
- locations
- urgency categories
- duplicate relationships
- resolution outcomes

### Blockchain

Blockchain provides integrity guarantees, not truth guarantees.

For example:

> A blockchain commitment can prove that a GPS coordinate was not changed after commitment, but it cannot by itself prove that the GPS coordinate was physically genuine at the time of capture.

Likewise, blockchain can prove what an AI system recorded, but cannot prove that the AI decision was correct.

### Infrastructure

Production deployment should additionally implement:

- managed database
- secure object storage
- centralized logging
- metrics
- alerting
- secret management
- rate limiting
- API authentication
- role enforcement
- backup and disaster recovery

---

# Future ML Roadmap

## Phase A — Dataset Engineering

Build a labeled civic grievance dataset with:

```text
Complaint
Language
Department
Priority
Urgency
Location
Entities
Duplicate Group
Resolution Time
Final Outcome
```

## Phase B — Supervised Classification

Train models for:

```text
Department Classification
Priority Classification
Urgency Classification
```

Candidate models:

- multilingual transformer
- Indic language models
- fine-tuned BERT-family models
- lightweight classifier for low-latency inference

## Phase C — Semantic Duplicate Detection

Replace simple keyword similarity with embedding-based retrieval.

Architecture:

```text
Complaint
   |
Embedding Model
   |
Vector Database
   |
Nearest Neighbour Search
   |
Similarity Threshold
   |
Human/AI Review
```

## Phase D — Multilingual Intelligence

Support:

- Hindi
- Hinglish
- regional Indian languages
- code-switching
- transliterated Indian languages

## Phase E — Model Monitoring

Track:

```text
accuracy
precision
recall
F1
routing accuracy
duplicate precision
false-positive rate
false-negative rate
latency
model drift
language-specific performance
```

## Phase F — Human-in-the-Loop Learning

Officer corrections can become training signals.

```text
AI Prediction
     |
Officer Review
     |
Correction
     |
Labeled Example
     |
Dataset
     |
Model Improvement
```

This creates a continuous civic-intelligence feedback loop.

---

# Production ML Evaluation

Before deploying a custom ML model, evaluate it using a held-out dataset.

Recommended metrics:

### Classification

```text
Accuracy
Macro F1
Weighted F1
Precision
Recall
Confusion Matrix
```

### Duplicate Detection

```text
Precision@K
Recall@K
F1
False Merge Rate
Missed Duplicate Rate
```

### Multilingual Performance

Evaluate independently by language:

```text
English
Hindi
Hinglish
Regional Languages
Code-Switched Input
```

A high overall score can hide poor performance for a particular language, so per-language evaluation is essential.

---

# Design Philosophy

SmartGov is built around five principles:

### 1. AI-Assisted, Not AI-Blind

AI accelerates decision-making, while deterministic safeguards and human workflows remain available.

### 2. Privacy by Design

Sensitive citizen information remains off-chain.

### 3. Integrity by Cryptographic Commitment

Critical lifecycle records can be independently verified.

### 4. Explainable Routing

Routing decisions expose department, confidence, entities, priority, and rationale.

### 5. Graceful Failure

External AI, RPC, or network failure should produce an explicit system state rather than a misleading success state.

---

# What Makes SmartGov Different?

Traditional grievance portals primarily provide:

```text
Form → Database → Officer
```

SmartGov aims for:

```text
Citizen
   ↓
Natural Language Understanding
   ↓
Multilingual Intelligence
   ↓
Risk & Priority Analysis
   ↓
Intelligent Routing
   ↓
Duplicate Awareness
   ↓
Real-Time Officer Workflow
   ↓
Resolution Evidence
   ↓
Cryptographic Integrity
   ↓
Independent Verification
```

The result is not merely a complaint submission portal.

It is a **civic intelligence and accountability platform**.

---

# Contributing

Contributions should preserve the system's core principles:

1. Do not expose citizen PII unnecessarily.
2. Do not bypass authorization.
3. Do not introduce fake blockchain verification.
4. Do not weaken cryptographic validation.
5. Keep AI outputs structured and testable.
6. Add tests for security-sensitive changes.
7. Document architectural changes.

Before submitting changes:

```bash
npm run lint
npm run build
```

Run the complete test suite when blockchain components are modified.

---

# License

Add the project's chosen license here before public distribution.

---

## Project Status

**Architecture:** AI + Web + EVM hybrid  
**AI:** Gemini + deterministic civic NLP fallback  
**Languages:** English / Hindi / Hinglish-oriented processing  
**Routing:** Single-primary-department civic routing  
**Integrity:** Cryptographic commitments + EVM smart contract  
**Verification:** Direct client-side JSON-RPC verification  
**Privacy:** PII kept off-chain  
**Testing:** Automated unit, adversarial, integration, and cryptographic validation
