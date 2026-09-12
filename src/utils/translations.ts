export type Language = 'en' | 'hi';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: TranslationDictionary = {
  // App & Header
  'app.name': {
    en: 'smartGov',
    hi: 'स्मार्टगॉव'
  },
  'app.portal': {
    en: 'Grievance Portal',
    hi: 'नागरिक शिकायत पोर्टल'
  },
  'app.subtitle': {
    en: 'Grievance AI',
    hi: 'शिकायत एआई'
  },
  'search.placeholder': {
    en: 'Search records or keyword...',
    hi: 'शिकायत, विभाग या शब्द खोजें...'
  },
  'role.officer': {
    en: 'Municipal Official',
    hi: 'नगर निगम अधिकारी'
  },
  'role.citizen': {
    en: 'Public Citizen',
    hi: 'आम नागरिक'
  },
  'role.switch': {
    en: 'Switch',
    hi: 'बदलें'
  },
  'role.perspective_officer': {
    en: 'Officer View',
    hi: 'अधिकारी दृश्य'
  },
  'role.perspective_citizen': {
    en: 'Citizen View',
    hi: 'नागरिक दृश्य'
  },

  // Navigation Items
  'nav.dashboard': {
    en: 'Dashboard',
    hi: 'डैशबोर्ड'
  },
  'nav.my_grievances': {
    en: 'My Grievances',
    hi: 'मेरी शिकायतें'
  },
  'nav.notifications': {
    en: 'Notifications',
    hi: 'सूचनाएं'
  },
  'nav.analytics': {
    en: 'Analytics',
    hi: 'विश्लेषण'
  },
  'nav.departments': {
    en: 'Departments',
    hi: 'विभाग'
  },
  'nav.settings': {
    en: 'Settings',
    hi: 'सेटिंग्स'
  },
  'nav.support': {
    en: 'Support & Help',
    hi: 'सहायता एवं संपर्क'
  },
  'nav.file_grievance': {
    en: 'Add New Complaint',
    hi: 'नई शिकायत दर्ज करें'
  },
  'nav.switch_account': {
    en: 'Switch Account / Login',
    hi: 'खाता बदलें / लॉगिन'
  },
  'nav.theme_mode': {
    en: 'Theme Mode',
    hi: 'थीम मोड'
  },
  'nav.language': {
    en: 'Language',
    hi: 'भाषा'
  },

  // Settings
  'settings.title': {
    en: 'Portal Settings & Configuration',
    hi: 'पोर्टल सेटिंग्स एवं विन्यास'
  },
  'settings.subtitle': {
    en: 'Customize language, visual theme, Civic Intelligence thresholds, and citizen dispatch alerts.',
    hi: 'भाषा, दृश्य थीम, नागरिक एआई संवेदनशीलता और अलर्ट सूचनाओं को अनुकूलित करें।'
  },
  'settings.save_preferences': {
    en: 'Save Preferences',
    hi: 'प्राथमिकताएं सहेजें'
  },
  'settings.saved_notice': {
    en: 'Saved Changes!',
    hi: 'परिवर्तन सहेजे गए!'
  },
  'settings.appearance_title': {
    en: 'Appearance & Portal Theme',
    hi: 'उपस्थिति एवं पोर्टल थीम'
  },
  'settings.appearance_desc': {
    en: 'Choose how smartGov displays on your screen. The setting persists across sessions on this device.',
    hi: 'स्मार्टगॉव का रंग रूप चुनें। यह सेटिंग इस डिवाइस पर हमेशा सुरक्षित रहेगी।'
  },
  'settings.language_title': {
    en: 'Site Language & Translation',
    hi: 'साइट भाषा एवं अनुवाद'
  },
  'settings.language_desc': {
    en: 'Switch portal interface between English and Hindi (हिन्दी). Translates all navigation, grievance cards, inspection details, and action buttons.',
    hi: 'पोर्टल इंटरफ़ेस को अंग्रेज़ी और हिन्दी के बीच बदलें। सभी मेनू, शिकायत विवरण, निरीक्षण रिपोर्ट और बटन का अनुवाद करता है।'
  },
  'settings.lang_english': {
    en: 'English (US/UK)',
    hi: 'अंग्रेज़ी (English)'
  },
  'settings.lang_hindi': {
    en: 'हिन्दी (Hindi)',
    hi: 'हिन्दी (Hindi)'
  },
  'settings.lang_active_badge': {
    en: 'Active Interface Language',
    hi: 'सक्रिय पोर्टल भाषा'
  },
  'settings.translation_preview_title': {
    en: 'Live Translation Preview',
    hi: 'प्रत्यक्ष अनुवाद पूर्वावलोकन'
  },
  'settings.translation_preview_text': {
    en: 'Public Works Department • Status: Solved & Verified • Field Officer Dispatched',
    hi: 'लोक निर्माण विभाग • स्थिति: निस्तारित एवं सत्यापित • फील्ड अधिकारी रवाना'
  },
  'settings.ai_title': {
    en: 'Civic Intelligence Engine',
    hi: 'नागरिक एआई विश्लेषण इंजन'
  },
  'settings.confidence_threshold': {
    en: 'Minimum Auto-Triage Confidence Threshold',
    hi: 'स्वतः वर्गीकरण न्यूनतम विश्वास सीमा'
  },
  'settings.duplicate_threshold': {
    en: 'Duplicate & Clustering Sensitivity',
    hi: 'समान शिकायत पहचान संवेदनशीलता'
  },
  'settings.active_model': {
    en: 'Active Multi-modal Triage Model',
    hi: 'सक्रिय बहुभाषी एआई मॉडल'
  },
  'settings.notification_title': {
    en: 'Notification & Citizen Communication',
    hi: 'अधिसूचना एवं नागरिक संचार'
  },
  'settings.sms_alerts': {
    en: 'Instant SMS / WhatsApp Citizen Alerts',
    hi: 'तत्काल एसएमएस / व्हाट्सएप नागरिक अलर्ट'
  },
  'settings.dispatch_notifs': {
    en: 'Automated Dispatch Notifications to Field Supervisors',
    hi: 'फील्ड पर्यवेक्षकों को स्वचालित प्रेषण सूचना'
  },

  // Notifications
  'notif.title': {
    en: 'Portal Notifications & Field Updates',
    hi: 'पोर्टल सूचनाएं एवं फील्ड अपडेट'
  },
  'notif.subtitle': {
    en: 'Real-time audit log tracking official inspection visits, acknowledged civic tickets, on-ground repairs, and verified resolutions.',
    hi: 'अधिकारियों के निरीक्षण, स्वीकृत शिकायतों, जमीनी मरम्मत और सत्यापित निस्तारण का लाइव ऑडिट लॉग।'
  },
  'notif.mark_all_seen': {
    en: 'Mark All as Seen',
    hi: 'सभी को देखा हुआ चिह्नित करें'
  },
  'notif.all_updates': {
    en: 'All Updates',
    hi: 'सभी अपडेट'
  },
  'notif.marked_recent': {
    en: 'Marked Recent',
    hi: 'हालिया चिह्नित'
  },
  'notif.seen_details': {
    en: 'Seen Details',
    hi: 'देखी गई स्थिति'
  },
  'notif.solved_details': {
    en: 'Solved Details',
    hi: 'निस्तारित स्थिति'
  },
  'notif.unseen': {
    en: 'Unseen',
    hi: 'अनदेखा'
  },
  'notif.view_ticket': {
    en: 'View Ticket',
    hi: 'शिकायत देखें'
  },
  'notif.mark_seen': {
    en: 'Mark Seen',
    hi: 'देखा हुआ करें'
  },
  'notif.mark_unseen': {
    en: 'Mark Unseen',
    hi: 'अनदेखा करें'
  },
  'notif.mark_solved': {
    en: 'Mark Solved',
    hi: 'निस्तारित करें'
  },
  'notif.solved_check': {
    en: 'Solved ✓',
    hi: 'निस्तारित ✓'
  },
  'notif.mark_recent_btn': {
    en: 'Mark Recent',
    hi: 'हालिया चिह्नित करें'
  },
  'notif.recent_check': {
    en: 'Recent ✓',
    hi: 'हालिया ✓'
  },
  'notif.reviewer': {
    en: 'Reviewer',
    hi: 'समीक्षक'
  },
  'notif.solved_by': {
    en: 'Solved by',
    hi: 'निस्तारण कर्ता'
  },
  'notif.acknowledged': {
    en: 'Acknowledged',
    hi: 'संज्ञान में लिया'
  },
  'notif.pending_review': {
    en: 'Pending Review',
    hi: 'समीक्षा लंबित'
  },
  'notif.resolved_verified': {
    en: 'Resolved & Verified',
    hi: 'निस्तारित एवं सत्यापित'
  },
  'notif.in_progress': {
    en: 'In Progress',
    hi: 'प्रगति पर'
  },

  // Grievance Statuses
  'status.open': {
    en: 'Open',
    hi: 'लंबित'
  },
  'status.in_progress': {
    en: 'In Progress',
    hi: 'प्रगति पर'
  },
  'status.resolved': {
    en: 'Resolved',
    hi: 'निस्तारित'
  },
  'status.escalated': {
    en: 'Escalated',
    hi: 'उच्च प्राथमिकता'
  },

  // Priority
  'priority.high': {
    en: 'High',
    hi: 'उच्च'
  },
  'priority.urgent': {
    en: 'Urgent',
    hi: 'अति-आवश्यक'
  },
  'priority.general': {
    en: 'General',
    hi: 'सामान्य'
  },

  // Departments
  'dept.water': {
    en: 'Water Supply Board',
    hi: 'जल आपूर्ति बोर्ड'
  },
  'dept.sanitation': {
    en: 'Solid Waste & Sanitation',
    hi: 'ठोस कचरा एवं स्वच्छता विभाग'
  },
  'dept.power': {
    en: 'Public Works (Power)',
    hi: 'विद्युत एवं प्रकाश विभाग'
  },
  'dept.roads': {
    en: 'Civil Infrastructure & Roads',
    hi: 'सड़क एवं नागरिक अवसंरचना'
  },
  'dept.parks': {
    en: 'Parks & Horticulture',
    hi: 'उद्यान एवं बागवानी'
  },
  'dept.health': {
    en: 'Health & Vector Control',
    hi: 'स्वास्थ्य एवं कीट नियंत्रण'
  },

  // Language chooser
  'lang.choose_language': {
    en: 'Choose Language',
    hi: 'भाषा चुनें'
  },
  'lang.english': {
    en: 'English',
    hi: 'English'
  },
  'lang.hindi': {
    en: 'हिन्दी',
    hi: 'हिन्दी'
  },
  'lang.switch_to_hindi': {
    en: 'हिन्दी में बदलें',
    hi: 'Switch to English'
  },
  'lang.current': {
    en: 'EN',
    hi: 'हि'
  },

  // Notifications Page & Cards
  'notifications.badge': {
    en: 'Civic Dispatch & Resolution Feed',
    hi: 'नागरिक प्रेषण एवं समाधान फ़ीड'
  },
  'notifications.hero_title': {
    en: 'Portal Notifications & Field Updates',
    hi: 'पोर्टल सूचनाएं एवं फील्ड अपडेट'
  },
  'notifications.hero_desc': {
    en: 'Real-time audit log tracking official inspection visits, acknowledged civic tickets, on-ground repairs, and verified resolutions.',
    hi: 'अधिकारियों के निरीक्षण दौरे, स्वीकृत नागरिक शिकायतें, ज़मीनी मरम्मत और सत्यापित समाधानों का रीयल-टाइम विवरण।'
  },
  'notifications.mark_all_seen': {
    en: 'Mark All as Seen',
    hi: 'सभी को देखा हुआ चिह्नित करें'
  },
  'notifications.total': {
    en: 'Total Notifications',
    hi: 'कुल सूचनाएं'
  },
  'notifications.total_sub': {
    en: 'All portal events',
    hi: 'सभी पोर्टल घटनाक्रम'
  },
  'notifications.marked_recent': {
    en: 'Marked Recent',
    hi: 'हालिया अलर्ट'
  },
  'notifications.marked_recent_sub': {
    en: 'Recent alerts today',
    hi: 'आज के ताज़ा अलर्ट'
  },
  'notifications.seen_details': {
    en: 'Seen Details',
    hi: 'देखे गए विवरण'
  },
  'notifications.seen_details_sub': {
    en: 'Officials acknowledged',
    hi: 'अधिकारियों द्वारा स्वीकृत'
  },
  'notifications.solved_details': {
    en: 'Solved Details',
    hi: 'हल किए गए विवरण'
  },
  'notifications.solved_details_sub': {
    en: 'Work orders verified',
    hi: 'कार्य आदेश सत्यापित'
  },
  'notifications.search_placeholder': {
    en: 'Search notifications by ID, keyword, officer, or department...',
    hi: 'आईडी, कीवर्ड, अधिकारी या विभाग द्वारा सूचनाएं खोजें...'
  },
  'notifications.filter_all': {
    en: 'All Updates',
    hi: 'सभी अपडेट'
  },
  'notifications.view_ticket': {
    en: 'View Grievance Ticket',
    hi: 'शिकायत टिकट देखें'
  },
  'notifications.mark_as_seen': {
    en: 'Mark as Seen',
    hi: 'देखा हुआ चिह्नित करें'
  },
  'notifications.mark_as_unseen': {
    en: 'Mark as Unseen',
    hi: 'अनदेखा चिह्नित करें'
  },
  'notifications.mark_as_solved': {
    en: 'Mark Solved',
    hi: 'हल हुआ चिह्नित करें'
  },
  'notifications.mark_as_unsolved': {
    en: 'Mark Unsolved',
    hi: 'अनसुलझा चिह्नित करें'
  },
  'notifications.field_inspection': {
    en: 'Field Inspection Log',
    hi: 'क्षेत्रीय निरीक्षण लॉग'
  },
  'notifications.verified_resolution': {
    en: 'Resolution Verified',
    hi: 'समाधान सत्यापित'
  }
};
