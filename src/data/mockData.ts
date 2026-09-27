import { Grievance, Officer, DepartmentSummary, AISystemMetrics } from '../types';

export const INITIAL_GRIEVANCES: Grievance[] = [
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
  },
  {
    id: 'GRV-2023-1033',
    citizenUid: 'UID-33019',
    citizenName: 'Sunita Nair',
    submittedAt: '21 Oct 2023, 11:20 AM',
    rawTimestamp: Date.now() - 48 * 60 * 60 * 1000,
    description: 'Nehru Park children play area swings broken and dangerous rusted edges exposed. Kids can get injured.',
    englishTranslation: 'Nehru Park children play area swings are broken with dangerous rusted edges exposed. Children risk injury.',
    detectedLanguage: 'English',
    title: 'Damaged playground swings and safety hazard in Nehru Park',
    department: 'Parks & Horticulture',
    confidenceScore: 92,
    priority: 'General',
    urgencyLevel: 'Moderate',
    sentiment: 'Concerned',
    entities: ['Nehru Park', 'Children Swings', 'Safety Hazard'],
    status: 'Resolved',
    location: {
      name: 'Nehru Park Gate 2',
      zone: 'Zone 3',
      ward: 'Ward 15',
      lat: 28.5912,
      lng: 77.1950,
      address: 'Children Playground Area, Nehru Park'
    },
    supportersCount: 29,
    hasSupported: false,
    resolutionProof: {
      officerName: 'Vikram Chawla',
      resolvedAt: '22 Oct 2023, 04:00 PM',
      notes: 'All damaged swings replaced with child-safe coated chains. Rusted frames welded and repainted.',
      photoUrl: 'https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=600&auto=format&fit=crop&q=60'
    },
    timeline: [
      {
        status: 'Submitted',
        timestamp: '21 Oct 2023, 11:20 AM',
        note: 'Submitted with photo attachment.',
        actor: 'Citizen UID-33019'
      },
      {
        status: 'Resolved',
        timestamp: '22 Oct 2023, 04:00 PM',
        note: 'Repairs completed by Municipal Workshop Team.',
        actor: 'Officer Vikram Chawla'
      }
    ]
  },
  {
    id: 'GRV-2023-1023',
    citizenUid: 'UID-99120',
    citizenName: 'Manish Verma',
    submittedAt: '20 Oct 2023, 09:10 PM',
    rawTimestamp: Date.now() - 72 * 60 * 60 * 1000,
    description: 'Street lights not working near main market area for past 2 weeks. Pedestrians facing issues.',
    englishTranslation: 'Street lights not working near main market area for past 2 weeks. Pedestrians facing issues.',
    detectedLanguage: 'English',
    title: 'Street lights not working near main market area for past 2 weeks',
    department: 'Public Works (Power)',
    confidenceScore: 95,
    priority: 'High',
    urgencyLevel: 'High Risk',
    sentiment: 'Anxious',
    entities: ['Main Market', 'Street Lights', 'Night Safety'],
    status: 'In Progress',
    location: {
      name: 'Central Market Road',
      zone: 'Zone 4',
      ward: 'Ward 12',
      lat: 28.6140,
      lng: 77.2092,
      address: 'Market Block B, Central Market'
    },
    supportersCount: 42,
    hasSupported: false,
    timeline: [
      {
        status: 'In Progress',
        timestamp: '21 Oct 2023, 10:00 AM',
        note: 'Underground cable fault identified. Heavy excavation team scheduled.',
        actor: 'Public Works Dept'
      }
    ]
  }
];

export const MOCK_GRIEVANCES = INITIAL_GRIEVANCES;

export const OFFICERS: Officer[] = [
  {
    id: 'OFF-101',
    name: 'Jane Smith',
    initials: 'JS',
    department: 'Roads & Power',
    activeCases: 24,
    resolved30d: 142,
    efficiency: 92,
    efficiencyScore: 92,
    role: 'Senior Road Inspector',
    badge: 'Senior Road Inspector',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'OFF-102',
    name: 'Michael Ross',
    initials: 'MR',
    department: 'Water Board',
    activeCases: 31,
    resolved30d: 98,
    efficiency: 78,
    efficiencyScore: 78,
    role: 'Hydro Operations Lead',
    badge: 'Hydro Operations Lead',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'OFF-103',
    name: 'Anita Patel',
    initials: 'AP',
    department: 'Sanitation',
    activeCases: 45,
    resolved30d: 112,
    efficiency: 85,
    efficiencyScore: 85,
    role: 'Zonal Sanitation Head',
    badge: 'Zonal Sanitation Head',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'OFF-104',
    name: 'Rajesh Kumar',
    initials: 'RK',
    department: 'Power Grid',
    activeCases: 19,
    resolved30d: 130,
    efficiency: 95,
    efficiencyScore: 95,
    role: 'Grid Safety Engineer',
    badge: 'Grid Safety Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  }
];

export const OFFICER_WORKLOAD_DATA = OFFICERS;

export const DEPARTMENT_SUMMARIES: DepartmentSummary[] = [
  {
    id: 'dept-1',
    name: 'Public Works (Power & Electrical)',
    shortName: 'Power',
    category: 'Infrastructure',
    activeComplaints: 340,
    resolvedComplaints: 2890,
    slaPercent: 94.2,
    avgHours: 18.5,
    officersCount: 28,
    iconName: 'bolt',
    accentColor: '#006c4a',
    officerInCharge: 'Rajesh Kumar',
    activeCases: 340,
    resolvedThisMonth: 2890,
    resolutionSla: '24 Hours',
    contactPhone: '1912'
  },
  {
    id: 'dept-2',
    name: 'Roads & Bridges (PWD)',
    shortName: 'Roads',
    category: 'Civil Works',
    activeComplaints: 840,
    resolvedComplaints: 4120,
    slaPercent: 88.5,
    avgHours: 36.2,
    officersCount: 42,
    iconName: 'traffic-cone',
    accentColor: '#131b2e',
    officerInCharge: 'Jane Smith',
    activeCases: 840,
    resolvedThisMonth: 4120,
    resolutionSla: '48 Hours',
    contactPhone: '155300'
  },
  {
    id: 'dept-3',
    name: 'Municipal Water Board',
    shortName: 'Water',
    category: 'Utilities',
    activeComplaints: 620,
    resolvedComplaints: 3650,
    slaPercent: 91.0,
    avgHours: 14.8,
    officersCount: 35,
    iconName: 'droplets',
    accentColor: '#497cff',
    officerInCharge: 'Michael Ross',
    activeCases: 620,
    resolvedThisMonth: 3650,
    resolutionSla: '12 Hours',
    contactPhone: '1800-121-2164'
  },
  {
    id: 'dept-4',
    name: 'Solid Waste & Sanitation',
    shortName: 'Sanitation',
    category: 'Public Health',
    activeComplaints: 410,
    resolvedComplaints: 3200,
    slaPercent: 96.4,
    avgHours: 8.4,
    officersCount: 50,
    iconName: 'trash-2',
    accentColor: '#00714e',
    officerInCharge: 'Anita Patel',
    activeCases: 410,
    resolvedThisMonth: 3200,
    resolutionSla: '6 Hours',
    contactPhone: '155300'
  },
  {
    id: 'dept-5',
    name: 'Parks & Recreation Department',
    shortName: 'Parks',
    category: 'Environment',
    activeComplaints: 125,
    resolvedComplaints: 980,
    slaPercent: 93.1,
    avgHours: 28.0,
    officersCount: 16,
    iconName: 'trees',
    accentColor: '#85f8c4',
    officerInCharge: 'Deepa Verma',
    activeCases: 125,
    resolvedThisMonth: 980,
    resolutionSla: '72 Hours',
    contactPhone: '011-23348890'
  }
];

export const SAMPLE_PROMPT_TEMPLATES = [
  {
    label: 'Street Light Outage (Hinglish)',
    lang: 'Hinglish',
    text: 'Hamare area mein 15 din se street lights band hain, raat ko chalna safe nahi lagta. Accident ka risk hai.'
  },
  {
    label: 'Water Leak / Burst Pipe (Hindi)',
    lang: 'Hindi',
    text: 'मेन रोड पर पानी की पाइपलाइन टूट गई है। सुबह से सड़क पर पानी भर रहा है और गाड़ियां फंस रही हैं।'
  },
  {
    label: 'Pothole Hazard (English)',
    lang: 'English',
    text: 'Large dangerous pothole on the corner of Ring Road near metro pillar 104. Two bikers skidded today.'
  },
  {
    label: 'Garbage Dump Overflow (Hinglish)',
    lang: 'Hinglish',
    text: 'Market ke paas kooda daan overflow ho gaya hai. Bohot badboo aa rahi hai aur stray animals jama ho rahe hain.'
  }
];
