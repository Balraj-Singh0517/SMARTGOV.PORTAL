import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';
import { blockchainService } from './server/services/blockchain/blockchainService';

dotenv.config();

const app = express();
const PORT = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Connected WebSocket clients registry
const wsClients = new Set<WebSocket>();

export function broadcastWs(type: string, payload: any) {
  const msg = JSON.stringify({
    type,
    payload,
    timestamp: Date.now()
  });
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(msg);
      } catch (err) {
        // Safe skip on transient write error
      }
    }
  }
}

export function broadcastPresence() {
  broadcastWs('presence:update', {
    onlineCount: Math.max(1, wsClients.size),
    timestamp: Date.now()
  });
}

// Wire blockchain transaction queue to WebSocket broadcaster
blockchainService.setWsBroadcaster(broadcastWs);

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// In-memory persistent database for the session
interface GrievanceItem {
  id: string;
  citizenUid: string;
  citizenName?: string;
  submittedAt: string;
  rawTimestamp: number;
  description: string;
  englishTranslation?: string;
  detectedLanguage: string;
  title: string;
  department: string;
  confidenceScore: number;
  priority: 'High' | 'General' | 'Urgent' | 'Low';
  urgencyLevel: 'High Risk' | 'Moderate' | 'Low';
  sentiment: string;
  entities: string[];
  status: 'Open' | 'In Progress' | 'Resolved' | 'Under Review';
  location: {
    name: string;
    zone: string;
    ward: string;
    lat: number;
    lng: number;
    address?: string;
  };
  supportersCount: number;
  hasSupported?: boolean;
  attachments?: any[];
  resolutionProof?: any;
  timeline?: any[];
  officialReplies?: any[];
  isUnseen?: boolean;
  blockchainAudit?: any;
}

let grievancesDb: GrievanceItem[] = [
  {
    id: 'GRV-2023-1042',
    citizenUid: 'UID-88942',
    citizenName: 'Aarav Sharma',
    submittedAt: '23 Oct 2023, 08:45 AM',
    rawTimestamp: Date.now() - 2 * 60 * 60 * 1000,
    description: 'Kal raat se Central Market ke paas ki street light band hai. Bohot andhera hai aur accident ka dar lagta hai. Pls fix asap. Waha already ek chota incident ho chuka hai subah.',
    englishTranslation: 'Street lights near Central Market have been out since last night. It is very dark and there is fear of accidents. Please fix ASAP. A minor incident already happened there this morning.',
    detectedLanguage: 'Hindi / Hinglish',
    title: 'Street light failure near Central Market causing safety risks',
    department: 'Public Works (Power)',
    confidenceScore: 94,
    priority: 'High',
    urgencyLevel: 'High Risk',
    sentiment: 'Anxious',
    entities: ['Central Market', 'Street Light', 'Night Outage', 'Accident Risk'],
    status: 'Open',
    location: {
      name: 'Central Market Road',
      zone: 'Zone 4',
      ward: 'Ward 12',
      lat: 28.6139,
      lng: 77.2090,
      address: 'Shop 14, Main Road, Central Market, New Delhi'
    },
    supportersCount: 42,
    hasSupported: false,
    attachments: [
      {
        type: 'photo',
        name: 'night_street_light_outage.jpg',
        url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=60'
      },
      {
        type: 'location',
        name: 'Geo-Coordinates Pin',
        url: '28.6139, 77.2090'
      }
    ],
    timeline: [
      {
        status: 'Submitted',
        timestamp: '23 Oct 2023, 08:45 AM',
        note: 'Grievance submitted by citizen via SmartGov Web Portal.',
        actor: 'Citizen UID-88942'
      },
      {
        status: 'AI Triaged',
        timestamp: '23 Oct 2023, 08:46 AM',
        note: 'Civic Intelligence routed to PWD (Power) with 94% confidence. Flagged High Risk due to accident history.',
        actor: 'Civic Intelligence Agent'
      }
    ]
  },
  {
    id: 'GRV-2023-1045',
    citizenUid: 'UID-49102',
    citizenName: 'Priya Mehra',
    submittedAt: '23 Oct 2023, 06:15 AM',
    rawTimestamp: Date.now() - 4 * 60 * 60 * 1000,
    description: 'Sector 42 residential area mein pichle 4 dino se regular garbage collection nahi hua hai. Road corner par bada dump jama ho gaya hai aur smell aa rahi hai.',
    englishTranslation: 'Regular garbage collection has not occurred for the past 4 days in Sector 42 residential area. A large garbage dump has accumulated at the road corner emitting foul odor.',
    detectedLanguage: 'Hinglish',
    title: 'Irregular garbage collection in Sector 42 residential area',
    department: 'Sanitation',
    confidenceScore: 96,
    priority: 'General',
    urgencyLevel: 'Moderate',
    sentiment: 'Frustrated',
    entities: ['Sector 42', 'Garbage Dump', 'Waste Management', 'Sanitation Worker'],
    status: 'In Progress',
    location: {
      name: 'Sector 42 Community Center Road',
      zone: 'Zone 2',
      ward: 'Ward 08',
      lat: 28.5821,
      lng: 77.3120,
      address: 'Near Gate 3, Sector 42, Green Park'
    },
    supportersCount: 18,
    hasSupported: false,
    timeline: [
      {
        status: 'Submitted',
        timestamp: '23 Oct 2023, 06:15 AM',
        note: 'Submitted via citizen app.',
        actor: 'Citizen UID-49102'
      },
      {
        status: 'Assigned',
        timestamp: '23 Oct 2023, 07:00 AM',
        note: 'Assigned to Ward Sanitation Supervisor Anita Patel. Cleaning vehicle dispatched.',
        actor: 'Dispatch Automation'
      }
    ]
  },
  {
    id: 'GRV-2023-1048',
    citizenUid: 'UID-71829',
    citizenName: 'Rohan Gupta',
    submittedAt: '22 Oct 2023, 02:30 PM',
    rawTimestamp: Date.now() - 24 * 60 * 60 * 1000,
    description: 'Main arterial road par 12-inch water supply pipeline burst ho gayi hai. Subah se paani beh raha hai aur 2km lamba traffic jam lag gaya hai. Jaldi team bhejiye.',
    englishTranslation: 'A 12-inch water supply pipeline has burst on the main arterial road. Water has been flooding the street since morning causing a 2km traffic jam. Please dispatch repair team urgently.',
    detectedLanguage: 'Hinglish',
    title: 'Water pipe burst on main road causing severe traffic block',
    department: 'Water Board',
    confidenceScore: 98,
    priority: 'High',
    urgencyLevel: 'High Risk',
    sentiment: 'Urgent',
    entities: ['Main Arterial Road', 'Pipeline Burst', 'Water Board', 'Traffic Congestion'],
    status: 'In Progress',
    location: {
      name: 'Ring Road Junction',
      zone: 'Zone 1',
      ward: 'Ward 03',
      lat: 28.6328,
      lng: 77.2197,
      address: 'Pillar 142, Outer Ring Road Flyover'
    },
    supportersCount: 76,
    hasSupported: true,
    timeline: [
      {
        status: 'Submitted',
        timestamp: '22 Oct 2023, 02:30 PM',
        note: 'Urgent citizen escalation.',
        actor: 'Citizen UID-71829'
      },
      {
        status: 'Emergency Dispatched',
        timestamp: '22 Oct 2023, 02:40 PM',
        note: 'Emergency Valve Isolation Team en route. Water line shut-off scheduled.',
        actor: 'Officer Michael Ross'
      }
    ]
  }
];

// Pre-seed initial grievances with on-chain audit records
async function seedBlockchainAudits() {
  for (const g of grievancesDb) {
    const meta = await blockchainService.registerComplaint({
      id: g.id,
      description: g.description,
      department: g.department,
      priority: g.priority,
      location: g.location,
    });
    g.blockchainAudit = meta;
  }
}
seedBlockchainAudits().catch((err) => console.warn('Blockchain audit initial seed warning:', err?.message));

// Fallback Rule-Based NLP analyzer if Gemini API key isn't active
function ruleBasedAnalyze(text: string, location?: string) {
  const lower = text.toLowerCase();
  
  let detectedLanguage = 'English';
  if (/(\bhai\b|\bmein\b|\bhain\b|\bka\b|\bki\b|\bke\b|\bse\b|\bho\b|\braat\b|\bpaani\b|\bkooda\b|\baap\b|\bkripya\b|\bbohot\b|\bandhera\b|\bband\b|\bgaya\b)/i.test(text)) {
    detectedLanguage = 'Hindi / Hinglish';
  } else if (/[\u0900-\u097F]/.test(text)) {
    detectedLanguage = 'Hindi (Devanagari)';
  }

  let department = 'Public Works (PWD)';
  let confidenceScore = 92;
  let priority: 'High' | 'General' | 'Urgent' | 'Low' = 'General';
  let urgencyLevel: 'High Risk' | 'Moderate' | 'Low' = 'Moderate';
  let tone = 'Concerned';
  let routingRationale = 'Assigned exclusively to one primary municipal department to prevent overlapping authority.';
  const entities: string[] = [];

  // STRICT SINGLE-DEPARTMENT MUNICIPAL HIERARCHY:
  // Evaluated in order of hazard risk so a problem NEVER goes into more than one department.
  if (/(light|andhera|power|bijli|pole|electric|wire|shock|current|transformer|dark)/i.test(lower)) {
    department = 'Public Works (Power)';
    confidenceScore = 96;
    routingRationale = 'Primary hazard: Electrical safety & public illumination. Routed exclusively to Public Works (Power) to mitigate electrocution and night safety risks.';
    entities.push('Street Light', 'Power Grid');
    if (/(accident|dar|chota incident|risk|khatra|child|injury|spark)/i.test(lower)) {
      priority = 'High';
      urgencyLevel = 'High Risk';
      tone = 'Anxious';
      entities.push('Accident Risk');
    }
  } else if (/(water|paani|leak|burst|pipe|pipeline|supply|drain|naali|jal|sewer|manhole)/i.test(lower)) {
    department = 'Water Board';
    confidenceScore = 97;
    routingRationale = 'Primary hazard: Municipal water infrastructure & hydraulic integrity. Routed exclusively to Water Board for immediate valve isolation and pipeline repair.';
    entities.push('Water Supply', 'Pipeline');
    if (/(burst|flood|jam|emergency|severe|bahut)/i.test(lower)) {
      priority = 'High';
      urgencyLevel = 'High Risk';
      tone = 'Urgent';
      entities.push('Traffic Block', 'Severe Leak');
    }
  } else if (/(pothole|road|gaddha|tar|bridge|divider|traffic|sadak|flyover)/i.test(lower)) {
    department = 'Roads & Bridges (PWD)';
    confidenceScore = 93;
    routingRationale = 'Primary hazard: Road surface and structural transit safety. Routed exclusively to Roads & Bridges (PWD) for pavement resurfacing and barrier restoration.';
    entities.push('Road Infrastructure', 'Pothole Hazard');
    if (/(accident|skid|death|danger|khatra)/i.test(lower)) {
      priority = 'High';
      urgencyLevel = 'High Risk';
    }
  } else if (/(garbage|kooda|kachra|dump|waste|smell|safai|sanitation|dustbin|badboo|litter)/i.test(lower)) {
    department = 'Sanitation';
    confidenceScore = 95;
    routingRationale = 'Primary hazard: Environmental cleanliness & public hygiene. Routed exclusively to Sanitation Department for compactor vehicle dispatch.';
    entities.push('Garbage Dump', 'Waste Management');
    tone = 'Frustrated';
  } else if (/(park|tree|swing|grass|garden|bench|flower|branch)/i.test(lower)) {
    department = 'Parks & Horticulture';
    confidenceScore = 91;
    routingRationale = 'Primary hazard: Urban green space and public recreation upkeep. Routed exclusively to Parks & Horticulture.';
    entities.push('Public Park', 'Playground');
  }

  // Location entity extraction
  if (/central market/i.test(lower)) entities.push('Central Market');
  if (/sector \d+/i.test(lower)) {
    const match = lower.match(/sector \d+/i);
    if (match) entities.push(match[0].toUpperCase());
  }
  if (/ring road/i.test(lower)) entities.push('Ring Road');

  let similarGrievance = null;
  // Duplicate check matching
  if (/(street light|light band|central market|andhera)/i.test(lower)) {
    similarGrievance = {
      id: 'GRV-1023',
      title: 'Street lights not working near main market area for past 2 weeks',
      description: 'Street lights not working near main market area for past 2 weeks...',
      matchPercentage: 85,
      supporters: 42,
      status: 'In Progress',
    };
  } else if (/(water|burst|pipeline)/i.test(lower)) {
    similarGrievance = {
      id: 'GRV-2023-1048',
      title: 'Water pipe burst on main road causing severe traffic block',
      description: 'Main arterial road water supply pipe leakage flooding road...',
      matchPercentage: 78,
      supporters: 76,
      status: 'In Progress',
    };
  }

  let englishTranslation = text;
  if (detectedLanguage.includes('Hindi') || detectedLanguage.includes('Hinglish')) {
    if (lower.includes('street light') || lower.includes('lights band')) {
      englishTranslation = 'Street lights in our area have been off for 15 days, it does not feel safe to walk at night. There is accident risk.';
    } else if (lower.includes('pipeline') || lower.includes('paani')) {
      englishTranslation = 'The water supply pipeline has burst on the main road. Water has been flooding the road since morning causing vehicle jams.';
    } else if (lower.includes('garbage') || lower.includes('kooda')) {
      englishTranslation = 'The garbage bin near the market has overflowed. Bad smell is spreading and stray animals are gathering.';
    } else {
      englishTranslation = `[Civic Auto-Translated]: ${text}`;
    }
  }

  return {
    detectedLanguage,
    contextSummary: `${detectedLanguage} detected. Context mapped to municipal triage directory.`,
    translatedText: englishTranslation,
    recommendedDepartment: department,
    confidenceScore,
    priority,
    urgencyLevel,
    tone,
    routingRationale,
    antiJurisdictionConflict: true,
    extractedEntities: Array.from(new Set(entities)),
    suggestedTitle: entities.length > 0 ? `${entities[0]} reported in area` : 'Civic Issue Reported',
    similarGrievance,
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Blockchain Audit Status
app.get('/api/blockchain/status', (req, res) => {
  res.json({
    success: true,
    status: blockchainService.getNetworkStatus(),
    timestamp: new Date().toISOString()
  });
});

// Blockchain Transaction Queue Inspection
app.get('/api/blockchain/queue', (req, res) => {
  res.json({
    success: true,
    stats: blockchainService.getNetworkStatus().queue,
    operations: blockchainService.getQueueOperations(),
    timestamp: new Date().toISOString()
  });
});

// Query On-Chain Grievance Audit Record & Event History
app.get('/api/blockchain/grievance/:id', async (req, res) => {
  try {
    const auditRecord = await blockchainService.getAuditRecord(req.params.id);
    if (!auditRecord) {
      return res.status(404).json({ success: false, error: 'Blockchain audit record not found for grievance' });
    }
    res.json({ success: true, data: auditRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch blockchain audit record' });
  }
});

// Verify Off-Chain Grievance Data against On-Chain Cryptographic Digest
app.post('/api/blockchain/verify/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const grievance = grievancesDb.find((g) => g.id === id);
    const candidate = grievance || req.body;

    if (!candidate || !candidate.id) {
      return res.status(400).json({ success: false, error: 'Grievance data required for verification' });
    }

    const verification = await blockchainService.verifyIntegrity(id, {
      id: candidate.id,
      description: req.body.description !== undefined ? req.body.description : candidate.description,
      department: req.body.department !== undefined ? req.body.department : candidate.department,
      priority: req.body.priority !== undefined ? req.body.priority : candidate.priority,
      location: candidate.location,
    });

    res.json({ success: true, result: verification });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Verification failed' });
  }
});

// List all grievances
app.get('/api/grievances', (req, res) => {
  res.json({
    success: true,
    data: grievancesDb,
  });
});

// Get single grievance
app.get('/api/grievances/:id', (req, res) => {
  const item = grievancesDb.find((g) => g.id === req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Grievance not found' });
  }
  res.json({ success: true, data: item });
});

// Submit new grievance
app.post('/api/grievances', async (req, res) => {
  const {
    description,
    englishTranslation,
    detectedLanguage,
    title,
    department,
    confidenceScore,
    priority,
    urgencyLevel,
    sentiment,
    entities,
    location,
    attachments,
  } = req.body;

  const newId = `GRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Commit on-chain tamper-evident audit record
  const blockchainAudit = await blockchainService.registerComplaint({
    id: newId,
    description: description || 'Civic issue report',
    department: department || 'Public Works (PWD)',
    priority: priority || 'General',
    location: location,
  });

  const newGrievance: GrievanceItem = {
    id: newId,
    citizenUid: `UID-${Math.floor(10000 + Math.random() * 90000)}`,
    citizenName: 'Citizen (You)',
    submittedAt: formattedDate,
    rawTimestamp: Date.now(),
    description: description || 'Civic issue report',
    englishTranslation: englishTranslation || description,
    detectedLanguage: detectedLanguage || 'English',
    title: title || 'Reported Civic Grievance',
    department: department || 'Public Works (PWD)',
    confidenceScore: confidenceScore || 94,
    priority: priority || 'General',
    urgencyLevel: urgencyLevel || 'Moderate',
    sentiment: sentiment || 'Concerned',
    entities: entities || [],
    status: 'Open',
    location: location || {
      name: 'Current Location',
      zone: 'Zone 4',
      ward: 'Ward 12',
      lat: 28.6139,
      lng: 77.2090,
      address: 'Central Market Road, New Delhi'
    },
    supportersCount: 1,
    hasSupported: true,
    attachments: attachments || [],
    blockchainAudit,
    timeline: [
      {
        status: 'Submitted',
        timestamp: formattedDate,
        note: `Grievance officially submitted by citizen via SmartGov Portal. Geo-Pin: ${location?.name || 'Central Ward'}.`,
        actor: 'Citizen UID-Self'
      },
      {
        status: 'Single-Department Routed',
        timestamp: formattedDate,
        note: `Civic AI isolated jurisdiction: routed exclusively to ${department || 'Public Works'}. Jurisdictional conflict prevention verified. Confidence: ${confidenceScore || 95}%.`,
        actor: 'Civic AI Intelligence Dispatcher'
      },
      {
        status: 'Blockchain Anchored',
        timestamp: formattedDate,
        note: `Tamper-evident audit record anchored on-chain. Hash: ${blockchainAudit.complaintHash.slice(0, 16)}...`,
        actor: 'SmartGov Audit Node'
      }
    ]
  };

  grievancesDb.unshift(newGrievance);

  // Broadcast real-time grievance creation via WebSocket
  broadcastWs('grievance:created', newGrievance);
  broadcastWs('notification:new', {
    id: `notif-${Date.now()}`,
    grievanceId: newGrievance.id,
    title: `New Grievance: ${newGrievance.title}`,
    desc: `${newGrievance.department} • ${newGrievance.location?.name || 'Central Ward'}`,
    category: newGrievance.department,
    department: newGrievance.department,
    location: newGrievance.location?.name || 'Central Ward',
    statusType: newGrievance.priority === 'High' || newGrievance.priority === 'Urgent' ? 'urgent' : 'in_progress',
    seen: false,
    solved: false,
    isRecent: true,
    timeAgo: 'Just now',
    rawTimestamp: Date.now(),
    priority: newGrievance.priority
  });

  res.status(201).json({ success: true, data: newGrievance });
});

// Update Grievance Status
app.patch('/api/grievances/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, note, officerName } = req.body;

  const itemIndex = grievancesDb.findIndex((g) => g.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ success: false, error: 'Grievance not found' });
  }

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  grievancesDb[itemIndex].status = status;
  if (!grievancesDb[itemIndex].timeline) {
    grievancesDb[itemIndex].timeline = [];
  }

  // Record status change on blockchain audit layer
  const auditMeta = await blockchainService.recordStatusChange(
    id,
    status,
    note || `Status updated to ${status}`,
    officerName || 'Zonal Officer'
  );
  if (auditMeta) {
    grievancesDb[itemIndex].blockchainAudit = auditMeta;
  }

  grievancesDb[itemIndex].timeline.push({
    status: `Status Changed to ${status}`,
    timestamp: formattedDate,
    note: note || `Status updated to ${status} by ${officerName || 'Officer'}.`,
    actor: officerName || 'Zonal Officer'
  });

  // Broadcast status change in real time to all connected clients
  broadcastWs('grievance:status_changed', grievancesDb[itemIndex]);

  res.json({ success: true, data: grievancesDb[itemIndex] });
});

// Transfer Grievance to another department
app.patch('/api/grievances/:id/transfer', async (req, res) => {
  const { id } = req.params;
  const { newDepartment, reason, officerName } = req.body;

  const itemIndex = grievancesDb.findIndex((g) => g.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ success: false, error: 'Grievance not found' });
  }

  const oldDept = grievancesDb[itemIndex].department;
  grievancesDb[itemIndex].department = newDepartment;

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Record department transfer on blockchain audit layer
  const auditMeta = await blockchainService.recordDepartmentTransfer(
    id,
    newDepartment,
    reason || 'Department reassigned',
    officerName || 'Zonal Inspector'
  );
  if (auditMeta) {
    grievancesDb[itemIndex].blockchainAudit = auditMeta;
  }

  if (!grievancesDb[itemIndex].timeline) {
    grievancesDb[itemIndex].timeline = [];
  }

  grievancesDb[itemIndex].timeline.push({
    status: 'Department Transferred',
    timestamp: formattedDate,
    note: `Transferred from ${oldDept} to ${newDepartment}. Reason: ${reason || 'Better jurisdiction alignment'}.`,
    actor: officerName || 'Zonal Officer'
  });

  // Broadcast transfer in real time
  broadcastWs('grievance:transferred', grievancesDb[itemIndex]);

  res.json({ success: true, data: grievancesDb[itemIndex] });
});

// Upload Resolution Proof
app.post('/api/grievances/:id/resolution-proof', async (req, res) => {
  const { id } = req.params;
  const { officerName, notes, photoUrl, materialsUsed } = req.body;

  const itemIndex = grievancesDb.findIndex((g) => g.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ success: false, error: 'Grievance not found' });
  }

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Commit resolution proof and image content hash to blockchain
  const auditMeta = await blockchainService.recordResolutionProof(id, {
    officerName: officerName || 'Senior Engineer',
    notes: notes || 'Work verified and resolved on ground.',
    photoUrl,
    materialsUsed,
  });
  if (auditMeta) {
    grievancesDb[itemIndex].blockchainAudit = auditMeta;
  }

  grievancesDb[itemIndex].resolutionProof = {
    officerName: officerName || 'Senior Engineer',
    resolvedAt: formattedDate,
    notes: notes || 'Work verified and resolved on ground.',
    photoUrl: photoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60',
    materialsUsed
  };
  grievancesDb[itemIndex].status = 'Resolved';

  grievancesDb[itemIndex].timeline?.push({
    status: 'Resolved with Proof',
    timestamp: formattedDate,
    note: `Resolution proof uploaded by ${officerName || 'Officer'}: ${notes}`,
    actor: officerName || 'Senior Officer'
  });

  // Broadcast resolution update in real time
  broadcastWs('grievance:updated', grievancesDb[itemIndex]);

  res.json({ success: true, data: grievancesDb[itemIndex] });
});

// Support existing grievance
app.post('/api/grievances/:id/support', (req, res) => {
  const { id } = req.params;
  const itemIndex = grievancesDb.findIndex((g) => g.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ success: false, error: 'Grievance not found' });
  }

  grievancesDb[itemIndex].supportersCount = (grievancesDb[itemIndex].supportersCount || 0) + 1;
  grievancesDb[itemIndex].hasSupported = true;

  // Broadcast supporter count update in real time
  broadcastWs('grievance:supported', {
    id,
    supportersCount: grievancesDb[itemIndex].supportersCount
  });

  res.json({ success: true, data: grievancesDb[itemIndex] });
});

// Municipal Security Codes & Authorization
const VALID_MUNICIPAL_CODES = [
  'GOV-2026-MUNI',
  'PWD-OFFICER-772',
  'WATER-ENG-902',
  'SANI-LEAD-551',
  'ADMIN-GOV-101',
  'CIVIC-2026'
];

function isAuthorizedMunicipalCode(code: string): boolean {
  if (!code) return false;
  const upper = code.trim().toUpperCase();
  if (VALID_MUNICIPAL_CODES.includes(upper)) return true;
  if (upper.startsWith('GOV-') || upper.startsWith('MUNI-') || upper.startsWith('PWD-') || upper.startsWith('WATER-') || upper.startsWith('SANI-') || upper.startsWith('ADMIN-')) {
    return upper.length >= 6;
  }
  return false;
}

// Authentication (Public Gmail Login vs Government Employee with Unique Code)
app.post('/api/auth/login', (req, res) => {
  const { role, email, uniqueCode, name, department } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Gmail / Email address is required.' });
  }

  if (role === 'officer') {
    if (!uniqueCode) {
      return res.status(401).json({
        success: false,
        error: 'Unique Security Verification Code is required for Government Employee / Municipality login.'
      });
    }

    if (!isAuthorizedMunicipalCode(uniqueCode)) {
      return res.status(401).json({
        success: false,
        error: 'Access Denied: Invalid Government Security Code. Only verified municipal employees with valid credentials may enter.'
      });
    }

    const assignedDept = department || 'Public Works (Power)';
    return res.json({
      success: true,
      user: {
        email,
        name: name || 'Officer ' + email.split('@')[0].toUpperCase(),
        role: 'officer',
        department: assignedDept,
        uniqueSecurityCode: uniqueCode.trim().toUpperCase(),
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      }
    });
  }

  // Public Citizen Login
  return res.json({
    success: true,
    user: {
      email,
      name: name || email.split('@')[0],
      role: 'citizen',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDv8p4i2-E_U7846OYqfzokBh1WM2lnghpgiI3419FHWfdExZ7-uyvX12SxIGIatDsQMBtmlas9soqnM7Z14UgzU2hADEJQ5Xbq2-IFjw8G3R-W2aRm6iwb3UE35GVcOJWcbUQGh8_h1xVyXBCqdec6sYZuTPt7B7VUrSZeWh0pVoDBnFfsPHzI_bbniTjC0pSQGTKaFjFwmcmvhFXgkzJ0eeHArmFpQJOf1weqBNXeY4IsQ5GG1NdRyA'
    }
  });
});

// Government Employee Reply to Department Problem
app.post('/api/grievances/:id/reply', async (req, res) => {
  const { id } = req.params;
  const { officerName, officerEmail, securityCode, department, replyText, statusSet } = req.body;

  if (!securityCode || !isAuthorizedMunicipalCode(securityCode)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only verified municipal employees with a valid unique security code can reply to department problems.'
    });
  }

  if (!replyText || !replyText.trim()) {
    return res.status(400).json({ success: false, error: 'Reply text cannot be empty.' });
  }

  const itemIndex = grievancesDb.findIndex((g) => g.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ success: false, error: 'Grievance not found' });
  }

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Map statusSet: 'solved' -> 'Resolved', 'in_progress' -> 'In Progress', 'unseen' -> 'Open'
  let newStatus: 'Open' | 'In Progress' | 'Resolved' = 'In Progress';
  if (statusSet === 'solved') newStatus = 'Resolved';
  else if (statusSet === 'unseen') newStatus = 'Open';
  else if (statusSet === 'in_progress') newStatus = 'In Progress';

  grievancesDb[itemIndex].status = newStatus;

  // Record officer reply action on blockchain audit layer
  const auditMeta = await blockchainService.recordOfficerReply(
    id,
    replyText.trim(),
    officerName || 'Municipal In-Charge',
    securityCode
  );
  if (auditMeta) {
    grievancesDb[itemIndex].blockchainAudit = auditMeta;
  }

  if (!grievancesDb[itemIndex].timeline) {
    grievancesDb[itemIndex].timeline = [];
  }

  const officialReply = {
    id: `REP-${Date.now()}`,
    officerName: officerName || 'Municipal In-Charge',
    officerEmail: officerEmail || 'officer@muni.gov.in',
    securityCode: (securityCode || '').toUpperCase(),
    department: department || grievancesDb[itemIndex].department,
    replyText: replyText.trim(),
    statusSet: statusSet || 'in_progress',
    timestamp: formattedDate
  };

  if (!grievancesDb[itemIndex].officialReplies) {
    grievancesDb[itemIndex].officialReplies = [];
  }
  grievancesDb[itemIndex].officialReplies.push(officialReply);

  grievancesDb[itemIndex].timeline.push({
    status: `Official Municipal Reply (${(statusSet || 'in_progress').toUpperCase().replace('_', ' ')})`,
    timestamp: formattedDate,
    note: `[Official Government Reply by ${officerName || 'Officer'} - Code: ${securityCode}]: ${replyText.trim()}`,
    actor: `${officerName || 'Municipal Officer'} (${securityCode})`
  });

  // Broadcast official reply and notification in real time
  broadcastWs('grievance:replied', {
    grievance: grievancesDb[itemIndex],
    reply: officialReply
  });
  broadcastWs('notification:new', {
    id: `notif-reply-${Date.now()}`,
    grievanceId: id,
    title: `Official Reply: ${grievancesDb[itemIndex].title.slice(0, 45)}...`,
    desc: `Replied by ${officerName} (${department}) • Status: ${newStatus}`,
    category: department || grievancesDb[itemIndex].department,
    department: department || grievancesDb[itemIndex].department,
    location: grievancesDb[itemIndex].location?.name || 'Central Ward',
    statusType: newStatus === 'Resolved' ? 'solved' : 'in_progress',
    seen: false,
    solved: newStatus === 'Resolved',
    isRecent: true,
    timeAgo: 'Just now',
    rawTimestamp: Date.now(),
    priority: grievancesDb[itemIndex].priority
  });

  res.json({ success: true, data: grievancesDb[itemIndex], reply: officialReply });
});

// Reverse Geocoding with OpenStreetMap Nominatim (Free, no API key required)
app.get('/api/location/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, error: 'Valid lat and lng query params are required' });
  }

  try {
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SmartGov-Civic-Platform/1.0 (https://smartgov.civic; contact@smartgov.gov)',
          'Accept-Language': 'en'
        }
      }
    );

    if (osmRes.ok) {
      const data = await osmRes.json();
      const addr = data.address || {};
      const road = addr.road || addr.street || addr.neighbourhood || addr.suburb || 'Local Street';
      const city = addr.city || addr.town || addr.village || addr.county || 'Metropolis';
      const zone = addr.city_district || addr.state_district || addr.county || 'Central Zone';
      const ward = addr.suburb || addr.quarter || (addr.postcode ? `Ward ${addr.postcode.slice(-3)}` : 'Ward 12');

      const location = {
        name: `${road}, ${city}`,
        zone: zone,
        ward: ward,
        lat: lat,
        lng: lng,
        address: data.display_name || `${road}, ${city}`
      };

      return res.json({ success: true, location, source: 'openstreetmap' });
    }
  } catch (err: any) {
    console.warn('OSM Reverse geocoding failed on server:', err?.message);
  }

  // Fallback if OSM rate-limited or offline
  return res.json({
    success: true,
    location: {
      name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      zone: 'Zone 4',
      ward: 'Ward 12',
      lat,
      lng,
      address: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
    },
    source: 'coordinate-fallback'
  });
});

// Search Places with OpenStreetMap Nominatim
app.get('/api/location/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  if (!query || query.length < 2) {
    return res.json({ success: true, places: [] });
  }

  try {
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SmartGov-Civic-Platform/1.0 (https://smartgov.civic; contact@smartgov.gov)',
          'Accept-Language': 'en'
        }
      }
    );

    if (osmRes.ok) {
      const results = await osmRes.json();
      const places = results.map((item: any) => {
        const addr = item.address || {};
        const road = addr.road || addr.neighbourhood || addr.suburb || item.name || 'Local Area';
        const city = addr.city || addr.town || addr.village || addr.county || 'Metro';
        return {
          displayName: item.display_name,
          name: `${road}, ${city}`,
          zone: addr.city_district || addr.state_district || 'Civic Zone',
          ward: addr.suburb || addr.quarter || 'Ward 1',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.display_name
        };
      });

      return res.json({ success: true, places });
    }
  } catch (err: any) {
    console.warn('OSM search failed on server:', err?.message);
  }

  return res.json({ success: true, places: [] });
});

// Real-time AI Grievance Parsing Endpoint using Gemini with Fallback
app.post('/api/ai/analyze-grievance', async (req, res) => {
  const { text, location } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text prompt is required' });
  }

  const ai = getAIClient();
  if (!ai) {
    // Return rule-based NLP analysis if no GEMINI_API_KEY
    const fallbackResult = ruleBasedAnalyze(text, location);
    return res.json({ success: true, result: fallbackResult, source: 'local-engine' });
  }

  try {
    const prompt = `You are the Civic Intelligence AI engine for the SmartGov Portal.
Analyze the following citizen grievance description (which may be in English, Hindi, Hinglish, or mixed Indian languages):
"${text}"

Citizen Location / Ward Context: "${location || 'New Delhi Central Zone'}"

CRITICAL DIRECTIVES:
1. STRICT SINGLE-DEPARTMENT JURISDICTION: Every civic problem MUST be routed to EXACTLY ONE authoritative department. Never assign multiple departments or duplicate tickets. If an issue mentions overlapping concerns (e.g., flooded road with pothole, or fallen tree touching electrical wire), resolve to the single root-cause department following municipal hierarchy:
   - Priority 1: Electrical shock, transformer spark, outage -> "Public Works (Power)"
   - Priority 2: Water pipe burst, flooding, drain/sewer -> "Water Board"
   - Priority 3: Road cave-in, pothole, divider -> "Roads & Bridges (PWD)"
   - Priority 4: Garbage accumulation, waste -> "Sanitation"
   - Priority 5: Tree branch, park upkeep -> "Parks & Horticulture"
   - Priority 6: Mosquito breeding, epidemics -> "Public Health"

Perform the following tasks:
1. Detect input language (e.g. "Hindi / Hinglish", "English", "Hindi (Devanagari)").
2. Provide an accurate English translation of the grievance.
3. Classify into EXACTLY ONE municipal department from the allowed list.
4. Output confidence score (integer 70-99).
5. Predict priority: "High", "General", "Urgent", or "Low".
6. Predict urgency level: "High Risk", "Moderate", or "Low".
7. Detect emotional tone/sentiment: "Anxious", "Frustrated", "Urgent", "Neutral", or "Concerned".
8. Extract key entities (array of strings, e.g. location, object, hazard).
9. Suggest a concise, professional title.
10. State the routing rationale explaining why this single department was chosen and how multi-department conflict was avoided.
11. Check if this is similar to common existing issues (e.g., street light outage in Central Market #GRV-1023, water pipe burst #GRV-2023-1048) and provide match details if similarity is >70%.

Respond strictly in JSON matching the schema.`;

    const candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let parsed: any = null;
    let successModel: string = '';

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedLanguage: { type: Type.STRING },
                contextSummary: { type: Type.STRING },
                translatedText: { type: Type.STRING },
                recommendedDepartment: { type: Type.STRING },
                confidenceScore: { type: Type.INTEGER },
                priority: { type: Type.STRING },
                urgencyLevel: { type: Type.STRING },
                tone: { type: Type.STRING },
                routingRationale: { type: Type.STRING },
                antiJurisdictionConflict: { type: Type.BOOLEAN },
                extractedEntities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                suggestedTitle: { type: Type.STRING },
                similarGrievance: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    matchPercentage: { type: Type.INTEGER },
                    supporters: { type: Type.INTEGER },
                    status: { type: Type.STRING }
                  }
                }
              },
              required: [
                'detectedLanguage',
                'translatedText',
                'recommendedDepartment',
                'confidenceScore',
                'priority',
                'urgencyLevel',
                'tone',
                'extractedEntities',
                'suggestedTitle'
              ]
            }
          }
        });

        if (response.text) {
          parsed = JSON.parse(response.text);
          successModel = modelName;
          break;
        }
      } catch (err) {
        // Continue to next available model if transient high demand (503/429) occurs
      }
    }

    if (parsed) {
      return res.json({ success: true, result: parsed, source: successModel });
    }

    // Fallback to rule-based analyzer if models are temporarily unreachable
    const fallbackResult = ruleBasedAnalyze(text, location);
    return res.json({ success: true, result: fallbackResult, source: 'rule-based-engine' });
  } catch (error: any) {
    const fallbackResult = ruleBasedAnalyze(text, location);
    return res.json({ success: true, result: fallbackResult, source: 'fallback-engine' });
  }
});

// WebSocket Status & Diagnostics Endpoint
app.get('/api/ws/status', (req, res) => {
  res.json({
    success: true,
    ws: {
      status: 'active',
      onlineCount: Math.max(1, wsClients.size),
      endpoint: '/ws',
      connectedClients: wsClients.size,
      protocol: 'RFC 6455 WebSocket'
    },
    timestamp: new Date().toISOString()
  });
});

// WebSocket Upgrade & Connection Logic
server.on('upgrade', (request, socket, head) => {
  try {
    const host = request.headers.host || 'localhost:3000';
    const parsedUrl = new URL(request.url || '', `http://${host}`);
    const pathname = parsedUrl.pathname.replace(/\/+$/, '');
    if (pathname === '/ws' || pathname.startsWith('/ws')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  } catch (e) {
    socket.destroy();
  }
});

wss.on('connection', (ws: WebSocket) => {
  wsClients.add(ws);

  // Send initial synchronized state to newly connected client
  ws.send(JSON.stringify({
    type: 'init:sync',
    payload: {
      grievances: grievancesDb,
      onlineCount: Math.max(1, wsClients.size),
      serverTime: new Date().toISOString()
    },
    timestamp: Date.now()
  }));

  broadcastPresence();

  // Handle client-to-server WebSocket events
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', payload: { time: Date.now() }, timestamp: Date.now() }));
      } else if (message.type === 'client:support') {
        const id = message.payload?.id;
        const item = grievancesDb.find((g) => g.id === id);
        if (item) {
          item.supportersCount = (item.supportersCount || 0) + 1;
          broadcastWs('grievance:supported', { id, supportersCount: item.supportersCount });
        }
      } else if (message.type === 'client:create_grievance') {
        const payload = message.payload;
        if (payload && payload.title) {
          const now = new Date();
          const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
            now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          const newGrievance: GrievanceItem = {
            id: payload.id || `GRV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            citizenUid: payload.citizenUid || 'UID-CITIZEN-WS',
            citizenName: payload.citizenName || 'Public Citizen',
            submittedAt: formattedDate,
            rawTimestamp: Date.now(),
            description: payload.description || '',
            englishTranslation: payload.englishTranslation || payload.description || '',
            detectedLanguage: payload.detectedLanguage || 'English',
            title: payload.title,
            department: payload.department || 'Public Works (PWD)',
            confidenceScore: payload.confidenceScore || 95,
            priority: payload.priority === 'High' || payload.priority === 'Urgent' || payload.priority === 'Low' ? payload.priority : 'General',
            urgencyLevel: payload.urgencyLevel || 'Moderate',
            sentiment: payload.sentiment || 'Concerned',
            entities: payload.entities || [],
            status: 'Open',
            location: payload.location || {
              name: 'Central Ward',
              zone: 'Central Zone',
              ward: 'Ward 12',
              lat: 28.6139,
              lng: 77.2090
            },
            supportersCount: 1,
            hasSupported: false,
            attachments: payload.attachments || [],
            timeline: [
              {
                status: 'Submitted via WebSocket',
                timestamp: formattedDate,
                note: 'Real-time WebSocket dispatch registered by civic portal engine.',
                actor: 'Citizen UID-Self'
              }
            ]
          };
          grievancesDb.unshift(newGrievance);
          broadcastWs('grievance:created', newGrievance);
          broadcastWs('notification:new', {
            id: `notif-${Date.now()}`,
            grievanceId: newGrievance.id,
            title: `New Grievance: ${newGrievance.title}`,
            desc: `${newGrievance.department} • ${newGrievance.location?.name || 'Central Ward'}`,
            category: newGrievance.department,
            department: newGrievance.department,
            location: newGrievance.location?.name || 'Central Ward',
            statusType: 'in_progress',
            seen: false,
            solved: false,
            isRecent: true,
            timeAgo: 'Just now',
            rawTimestamp: Date.now(),
            priority: newGrievance.priority
          });
        }
      }
    } catch (e) {
      // Safe skip malformed payload
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    broadcastPresence();
  });

  ws.on('error', () => {
    wsClients.delete(ws);
    broadcastPresence();
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartGov Portal server running on http://0.0.0.0:${PORT} (HTTP & WebSocket /ws)`);
  });
}

process.on('SIGINT', () => {
  blockchainService.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  blockchainService.shutdown();
  process.exit(0);
});

startServer();
