import { GOVERNMENT_SERVICES } from '../../data/governmentServices.js';

/**
 * Government Portal - AI Service & RAG Engine
 * Architecture:
 * 1. Intent Detection & Language Detection
 * 2. Semantic Service Matching (Multilingual TF-IDF & Weighted Keywords)
 * 3. Retrieval-Augmented Generation (Grounded against official government services)
 * 4. Anti-Prompt-Injection Security Filter
 * 5. Application Status & Form Assistance
 */

// Malicious prompt injection patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /reveal\s+(the\s+)?(system\s+prompt|database|password|secret|key|token)/i,
  /dump\s+(all\s+)?(tables|users|passwords)/i,
  /show\s+me\s+another\s+(user|citizen|person)/i,
  /bypass\s+(security|auth|login|rules)/i,
  /you\s+are\s+now\s+(in\s+god\s+mode|dan|unrestricted)/i,
  /drop\s+table/i,
  /<script[\s\S]*?>/i,
];

/**
 * Detect language based on unicode range or keywords
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';

  // Devanagari script covers both Marathi and Hindi (\u0900-\u097F)
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (devanagariCount > 2) {
    // Distinguish Marathi vs Hindi via common characteristic words
    const marathiMarkers = ['आहे', 'नाही', 'कसा', 'करावा', 'हवे', 'दाखला', 'प्रमाणपत्र', 'माझे', 'मला', 'पाहिजे', 'कधी', 'मिळेल'];
    const isMarathi = marathiMarkers.some(word => text.includes(word));
    return isMarathi ? 'mr' : 'hi';
  }
  return 'en';
}

/**
 * Sanitizes user query and rejects prompt-injection attacks
 */
export function sanitizeAndGuardPrompt(query) {
  if (!query || typeof query !== 'string') return { safe: false, cleanQuery: '' };

  const clean = query.trim().substring(0, 500); // Enforce reasonable length limit

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        safe: false,
        cleanQuery: clean,
        reason: 'The query contains unauthorized instructions or attempts to bypass system constraints.',
      };
    }
  }
  return { safe: true, cleanQuery: clean };
}

/**
 * Detects citizen intent from natural language input
 */
export function classifyIntent(query) {
  const q = query.toLowerCase();

  if (/document|kaagaz|kagad|kagadpatre|proof|कागदपत्रे|दस्तावेज|प्रमाण|papers/i.test(q)) {
    return 'document_query';
  }
  if (/status|track|where is|progress|pending|तक्रार स्थिती|स्थिती|ट्रॅक|स्टेटस|कधी मिळेल/i.test(q)) {
    return 'status_check';
  }
  if (/fee|charge|cost|rupee|rs|paise|फी|खर्च|शुल्क|रुपये/i.test(q)) {
    return 'fee_query';
  }
  if (/time|how long|days|hours|sla|किती दिवस|वेळ|समय|कितने दिन/i.test(q)) {
    return 'sla_query';
  }
  if (/eligible|who can|qualification|eligibility|पात्रता|कोण अर्ज करू शकतो/i.test(q)) {
    return 'eligibility_query';
  }
  if (/complain|grievance|pothole|water|light|garbage|तक्रार|खड्डा|पाणी|कचरा|शिकायत/i.test(q)) {
    return 'complaint_help';
  }
  return 'find_service';
}

/**
 * RAG Semantic Matcher for Official Government Services
 */
export function searchServicesSemantic(query, language = 'en', maxResults = 4) {
  const guard = sanitizeAndGuardPrompt(query);
  if (!guard.safe) {
    return {
      success: false,
      message: guard.reason,
      results: [],
    };
  }

  const clean = guard.cleanQuery.toLowerCase();
  const tokens = clean.split(/[\s,?.!]+/).filter(t => t.length > 1);

  const scoredServices = GOVERNMENT_SERVICES.map(service => {
    let score = 0;
    const matchedKeywords = [];

    // 1. Direct Keyword matching (Highest weight: 10 pts per match)
    service.keywords.forEach(kw => {
      const lkw = kw.toLowerCase();
      if (clean.includes(lkw)) {
        score += 10;
        matchedKeywords.push(kw);
      }
      tokens.forEach(tok => {
        if (lkw.includes(tok) || tok.includes(lkw)) {
          score += 4;
        }
      });
    });

    // 2. Name & Title match (Weight: 8 pts)
    const allNames = [service.name, service.marathiName, service.hindiName].join(' ').toLowerCase();
    tokens.forEach(tok => {
      if (allNames.includes(tok)) score += 8;
    });

    // 3. Category & Department match (Weight: 5 pts)
    const catDept = [service.category, service.department].join(' ').toLowerCase();
    tokens.forEach(tok => {
      if (catDept.includes(tok)) score += 5;
    });

    // 4. Description overlap (Weight: 2 pts)
    const allDesc = [service.description, service.marathiDescription, service.hindiDescription].join(' ').toLowerCase();
    tokens.forEach(tok => {
      if (allDesc.includes(tok)) score += 2;
    });

    return {
      ...service,
      relevanceScore: score,
      matchedKeywords: Array.from(new Set(matchedKeywords)),
    };
  });

  // Filter relevant items and sort by descending relevance
  const results = scoredServices
    .filter(s => s.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

  // If exact query yields no high score, return popular services as fallback
  const finalResults = results.length > 0 ? results : GOVERNMENT_SERVICES.slice(0, 3).map(s => ({ ...s, relevanceScore: 1 }));

  return {
    success: true,
    query: guard.cleanQuery,
    language: language || detectLanguage(guard.cleanQuery),
    intent: classifyIntent(guard.cleanQuery),
    totalMatches: results.length,
    results: finalResults.map(s => ({
      id: s.id,
      name: language === 'mr' ? s.marathiName || s.name : language === 'hi' ? s.hindiName || s.name : s.name,
      englishName: s.name,
      department: s.department,
      category: s.category,
      description: language === 'mr' ? s.marathiDescription || s.description : language === 'hi' ? s.hindiDescription || s.description : s.description,
      fees: s.fees,
      processingTime: s.processingTime,
      applicationUrl: s.applicationUrl,
      documentsCount: s.documentsRequired.length,
      whyRecommended: generateRecommendationRationale(s, clean, language),
    })),
  };
}

/**
 * Generates transparent grounding rationale ("Why this service?")
 */
function generateRecommendationRationale(service, query, language) {
  if (language === 'mr') {
    return `आपल्या विचारलेल्या प्रश्नानुसार ("${query}"), ही अधिकृत शासकीय सेवा आपल्या गरजेसाठी सर्वात योग्य आहे.`;
  }
  if (language === 'hi') {
    return `आपके प्रश्न ("${query}") के आधार पर, यह आधिकारिक सरकारी सेवा आपकी आवश्यकता के लिए अनुशंसित है।`;
  }
  return `Based on your request ("${query}"), this official government service is designated for this purpose under Maharashtra Government portal guidelines.`;
}

/**
 * Conversational RAG Engine for Global AI Assistant
 */
export async function processCitizenChat({ message, language = 'en', user = null, context = {} }) {
  const guard = sanitizeAndGuardPrompt(message);
  if (!guard.safe) {
    return {
      success: false,
      response: language === 'mr'
        ? 'क्षमस्व, आपल्या विनंतीमध्ये अनधिकृत आज्ञा आढळल्यामुळे सुरक्षा नियमांनुसार सेवा नाकारण्यात आली आहे.'
        : language === 'hi'
          ? 'क्षमा करें, सुरक्षा नियमों के अनुसार आपकी इस विनंती पर कार्रवाई नहीं की जा सकती।'
          : 'I cannot process this request because it violates portal security guidelines or contains unauthorized instructions.',
      actions: [],
      source: 'Portal Security Guard',
    };
  }

  const detectedLang = language || detectLanguage(guard.cleanQuery);
  const intent = classifyIntent(guard.cleanQuery);
  const searchResult = searchServicesSemantic(guard.cleanQuery, detectedLang, 2);
  const topService = searchResult.results[0] ? GOVERNMENT_SERVICES.find(s => s.id === searchResult.results[0].id) : null;

  // Build grounded response according to intent & language
  let textResponse = '';
  const actions = [];

  if (topService) {
    const serviceName = detectedLang === 'mr' ? topService.marathiName : detectedLang === 'hi' ? topService.hindiName : topService.name;

    switch (intent) {
      case 'document_query':
        if (detectedLang === 'mr') {
          textResponse = `📌 **${serviceName}** साठी आवश्यक कागदपत्रे:\n` +
            topService.documentsRequired.map((d, i) => `${i + 1}. **${d.name}**\n   ↳ *कारण:* ${d.whyRequired}`).join('\n');
        } else if (detectedLang === 'hi') {
          textResponse = `📌 **${serviceName}** के लिए आवश्यक दस्तावेज़:\n` +
            topService.documentsRequired.map((d, i) => `${i + 1}. **${d.name}**\n   ↳ *कारण:* ${d.whyRequired}`).join('\n');
        } else {
          textResponse = `📌 Official Required Documents for **${serviceName}**:\n\n` +
            topService.documentsRequired.map((d, i) => `${i + 1}. **${d.name}**\n   ↳ *Why needed:* ${d.whyRequired}`).join('\n\n');
        }
        actions.push(
          { label: 'View Service Details', url: topService.applicationUrl, type: 'navigate' },
          { label: 'Document Checklist', action: 'document_check', serviceId: topService.id, type: 'action' }
        );
        break;

      case 'fee_query':
        textResponse = detectedLang === 'mr'
          ? `💰 **${serviceName}** साठी अधिकृत शासकीय शुल्क:\n${topService.fees}\n(महाराष्ट्र लोकसेवा हमी कायद्यानुसार कोणतेही छुपे शुल्क नाही.)`
          : detectedLang === 'hi'
            ? `💰 **${serviceName}** के लिए आधिकारिक शुल्क:\n${topService.fees}\n(कोई अतिरिक्त छिपा हुआ शुल्क नहीं है।)`
            : `💰 Official Government Fee for **${serviceName}**:\n${topService.fees}\n\nAll fees are statutory under the Maharashtra Right to Services (RTS) Act.`;
        actions.push({ label: 'Start Application', url: topService.applicationUrl, type: 'navigate' });
        break;

      case 'sla_query':
        textResponse = detectedLang === 'mr'
          ? `⏱ **${serviceName}** साठी अंदाजे कालावधी:\n${topService.processingTime}`
          : detectedLang === 'hi'
            ? `⏱ **${serviceName}** के लिए अनुमानित प्रसंस्करण समय:\n${topService.processingTime}`
            : `⏱ Official Processing Time for **${serviceName}**:\n${topService.processingTime}`;
        actions.push({ label: 'Track An Application', url: '/track', type: 'navigate' });
        break;

      case 'eligibility_query':
        textResponse = detectedLang === 'mr'
          ? `✅ **${serviceName}** साठी पात्रता अटी:\n` + topService.eligibility.map(e => `• ${e}`).join('\n')
          : detectedLang === 'hi'
            ? `✅ **${serviceName}** के लिए पात्रता मानदंड:\n` + topService.eligibility.map(e => `• ${e}`).join('\n')
            : `✅ Eligibility Criteria for **${serviceName}**:\n` + topService.eligibility.map(e => `• ${e}`).join('\n');
        actions.push({ label: 'Check My Eligibility', url: topService.applicationUrl, type: 'navigate' });
        break;

      default:
        // Service Guidance
        if (detectedLang === 'mr') {
          textResponse = `मी आपल्या विनंतीनुसार अधिकृत शासकीय सेवा शोधली आहे:\n\n🏛️ **${serviceName}**\n${topService.marathiDescription}\n\n• **विभाग:** ${topService.department}\n• **कालावधी:** ${topService.processingTime}\n• **शुल्क:** ${topService.fees}`;
        } else if (detectedLang === 'hi') {
          textResponse = `मैंने आपके प्रश्न के अनुसार आधिकारिक सरकारी सेवा ढूंढी है:\n\n🏛️ **${serviceName}**\n${topService.hindiDescription}\n\n• **विभाग:** ${topService.department}\n• **प्रसंस्करण समय:** ${topService.processingTime}\n• **शुल्क:** ${topService.fees}`;
        } else {
          textResponse = `I found the following verified government service matching your request:\n\n🏛️ **${serviceName}**\n${topService.description}\n\n• **Department:** ${topService.department}\n• **Processing SLA:** ${topService.processingTime}\n• **Statutory Fee:** ${topService.fees}`;
        }
        actions.push(
          { label: 'Start Application', url: topService.applicationUrl, type: 'navigate' },
          { label: 'Required Documents', action: 'show_docs', serviceId: topService.id, type: 'action' },
          { label: 'Guided Journey', action: 'start_journey', serviceId: topService.id, type: 'action' }
        );
    }
  } else {
    textResponse = detectedLang === 'mr'
      ? 'आपला प्रश्न अधिकृत सेवा सूचीमध्ये थेट जुळला नाही. आपण तक्रार निवारण किंवा दाखल्यांविषयी विचारू शकता.'
      : detectedLang === 'hi'
        ? 'आपका प्रश्न सीधे आधिकारिक सेवा सूची में नहीं मिला। आप प्रमाण पत्र या शिकायत निवारण से संबंधित पूछ सकते हैं।'
        : "I couldn't locate a verified service matching your exact description. You can search for services like Domicile, Caste, Income Certificate, or civic complaints like Potholes and Water Supply.";
    actions.push(
      { label: 'Browse All Services', url: '/services', type: 'navigate' },
      { label: 'Lodge Grievance', url: '/complaints/new', type: 'navigate' },
      { label: 'Help & Support', url: '/help', type: 'navigate' }
    );
  }

  return {
    success: true,
    response: textResponse,
    language: detectedLang,
    intent,
    service: topService ? { id: topService.id, name: topService.name } : null,
    actions,
    source: 'Official Government of Maharashtra Citizen Services Guidelines',
  };
}

/**
 * Explains administrative grievance status in plain, empathetic citizen language
 */
export function explainComplaintStatus({ status, complaint, language = 'en' }) {
  const lang = language || 'en';
  const cleanStatus = (status || 'Submitted').toLowerCase();

  const explanations = {
    submitted: {
      en: 'Your grievance has been safely registered in the government portal and a unique tracking ID has been generated. The system is routing it to the concerned division engineer. No action is required from you at this time.',
      mr: 'आपली तक्रार अधिकृत पोर्टलवर सुरक्षितपणे नोंदवली गेली आहे आणि ट्रॅकिंग आयडी तयार झाला आहे. संबंधित विभागाकडे ती वर्ग केली जात असून सध्या आपणास काहीही करण्याची आवश्यकता नाही.',
      hi: 'आपकी शिकायत सफलतापूर्वक पोर्टल में दर्ज हो गई है और संबंधित विभाग को भेजी जा रही है। इस समय आपकी ओर से किसी कार्रवाई की आवश्यकता नहीं है।',
      nextStep: 'Department verification within 24 hours.',
    },
    'under review': {
      en: 'The nodal administrative officer has reviewed your complaint details and location photos. It is currently being scheduled for field inspection or assigned to a maintenance team.',
      mr: 'प्रशासकीय अधिकाऱ्यांनी आपल्या तक्रारीची पडताळणी केली असून प्रत्यक्ष पाहणीसाठी किंवा दुरुस्ती पथकाकडे सोपवण्याची प्रक्रिया सुरू आहे.',
      hi: 'अधिकारी आपकी शिकायत और फोटो का निरीक्षण कर रहे हैं। इसे फील्ड टीम को सौंपा जा रहा है।',
      nextStep: 'Field inspection assignment.',
    },
    assigned: {
      en: 'A specific government officer or junior engineer has been officially assigned to resolve your grievance. The assigned officer is responsible for carrying out the work within the mandated SLA.',
      mr: 'आपल्या तक्रारीचे निवारण करण्यासाठी जबाबदार शासकीय अधिकारी अथवा कनिष्ठ अभियंता नियुक्त करण्यात आले आहेत. दिलेल्या कालमर्यादेत ते काम पूर्ण करतील.',
      hi: 'आपकी शिकायत के निवारण के लिए एक अधिकारी नियुक्त किया गया है, जो निर्धारित समय में कार्रवाई करेंगे।',
      nextStep: 'On-ground work execution.',
    },
    'in progress': {
      en: 'On-ground work is currently underway. The field team or contractor is actively resolving the reported issue. Completion updates will be logged on your timeline.',
      mr: 'प्रत्यक्ष जागेवर कामाची प्रक्रिया सुरू आहे. दुरुस्ती पथक सक्रियपणे काम करत असून काम पूर्ण होताच आपल्याला कळवण्यात येईल.',
      hi: 'धरातल पर कार्य प्रगति पर है। मरम्मत दल सक्रिय रूप से समस्या का समाधान कर रहा है।',
      nextStep: 'Completion report & photo upload.',
    },
    resolved: {
      en: 'The assigned officer has completed the rectification work and uploaded resolution proof. Please review the resolution details. If satisfied, no further action is needed; otherwise, you may request a review.',
      mr: 'अधिकाऱ्यांनी काम पूर्ण केले असून अहवाल सादर केला आहे. कृपया आपण तपशील तपासावा. समाधान न झाल्यास आपण पुनर्परीक्षणाची विनंती करू शकता.',
      hi: 'अधिकारी द्वारा कार्य पूर्ण कर दिया गया है। कृपया समाधान की समीक्षा करें। असंतुष्ट होने पर आप पुनर्विचार का अनुरोध कर सकते हैं।',
      nextStep: 'Citizen feedback / satisfaction confirmation.',
    },
    closed: {
      en: 'This grievance lifecycle has been formally concluded and verified against quality standards.',
      mr: 'सदर तक्रार अधिकृतपणे पूर्ण होऊन दप्तरी नोंद करण्यात आली आहे.',
      hi: 'यह शिकायत प्रक्रिया पूर्ण रूप से बंद कर दी गई है।',
      nextStep: 'None required.',
    },
  };

  const matched = explanations[cleanStatus] || explanations.submitted;

  return {
    success: true,
    status,
    title: lang === 'mr' ? 'स्थितीचे स्पष्टीकरण' : lang === 'hi' ? 'स्थिति का विवरण' : 'Status Explanation',
    explanation: matched[lang] || matched.en,
    nextStep: matched.nextStep,
    slaTarget: complaint?.slaDeadline || 'Under Standard Citizen Charter SLA',
    source: 'Maharashtra Public Services Guarantee Charter',
  };
}

/**
 * Contextual AI Form Field Explanations
 */
export function explainFormField({ fieldName, serviceType, language = 'en' }) {
  const lang = language || 'en';
  const key = (fieldName || '').toLowerCase();

  const fieldGuides = {
    annualincome: {
      en: 'Enter the gross annual income of your entire household from all legitimate sources (salary, agriculture, business). Must match your Form 16, ITR, or Talathi certificate.',
      mr: 'कुटुंबातील सर्व व्यक्तींचे सर्व मार्गांनी मिळणारे एकूण वार्षिक उत्पन्न नोंदवा. हे उत्पन्न आपल्या फॉर्म १६ किंवा तलाठी दाखल्याशी जुळणे आवश्यक आहे.',
      hi: 'अपने परिवार की सभी स्रोतों से कुल वार्षिक आय दर्ज करें। यह आपके फॉर्म 16 या आय प्रमाण पत्र से मेल खानी चाहिए।',
    },
    aadhaar: {
      en: 'Enter your 12-digit UIDAI Aadhaar number. This is used strictly for identity verification against official government records via secure OTP.',
      mr: 'आपला १२ अंकी आधार क्रमांक नोंदवा. हा क्रमांक केवळ अधिकृत ओळख पडताळणीसाठी सुरक्षितपणे वापरला जातो.',
      hi: 'अपना 12 अंकों का आधार नंबर दर्ज करें। इसका उपयोग केवल आधिकारिक पहचान सत्यापन के लिए किया जाता है।',
    },
    landmark: {
      en: 'Provide a prominent nearby public landmark (such as a school, bus stop, hospital, or temple) to help field engineers easily locate the spot.',
      mr: 'अधिकाऱ्यांना जागेवर पोहोचणे सुलभ व्हावे यासाठी जवळची प्रसिद्ध खूण (उदा. शाळा, बस थांबा, रुग्णालय अथवा मंदिर) नमूद करा.',
      hi: 'आस-पास का कोई प्रमुख लैंडमार्क (जैसे स्कूल, बस स्टॉप, मंदिर) बताएं ताकि इंजीनियर आसानी से स्थान तक पहुंच सकें।',
    },
    subcategory: {
      en: 'Select the specific problem type that best represents the ground reality. Choosing the exact subcategory ensures faster routing to the right specialist engineer.',
      mr: 'समस्येचा अचूक उपप्रकार निवडा, ज्यामुळे आपली तक्रार थेट संबंधित तांत्रिक तज्ज्ञाकडे वेगाने वर्ग होते.',
      hi: 'समस्या का सटीक उप-प्रकार चुनें ताकि शिकायत तेजी से सही इंजीनियर तक पहुंचे।',
    },
  };

  const found = fieldGuides[key] || {
    en: `Enter accurate information for "${fieldName}" as stated in your official government documentation.`,
    mr: `आपल्या अधिकृत शासकीय कागदपत्रांनुसार "${fieldName}" विषयी अचूक माहिती भरा.`,
    hi: `अपने आधिकारिक सरकारी दस्तावेजों के अनुसार "${fieldName}" की सटीक जानकारी भरें।`,
  };

  return {
    success: true,
    field: fieldName,
    helpText: found[lang] || found.en,
    source: 'Official Portal Form Guide',
  };
}

/**
 * Smart Form Validation: Detects obvious user input inconsistencies (non-destructive)
 */
export function validateFormConsistency(formData, language = 'en') {
  const lang = language || 'en';
  const warnings = [];

  // 1. Age vs Year of Birth Check
  if (formData.age && formData.dob) {
    const birthYear = new Date(formData.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    const calculatedAge = currentYear - birthYear;
    const enteredAge = parseInt(formData.age, 10);

    if (!isNaN(enteredAge) && !isNaN(calculatedAge) && Math.abs(calculatedAge - enteredAge) > 1) {
      warnings.push({
        field: 'dob',
        message: lang === 'mr'
          ? `नोंदवलेले वय (${enteredAge}) आणि जन्म वर्ष (${birthYear}) यामध्ये विसंगती आढळली आहे. कृपया माहिती तपासा.`
          : lang === 'hi'
            ? `दर्ज की गई आयु (${enteredAge}) और जन्म वर्ष (${birthYear}) में अंतर प्रतीत होता है। कृपया पुनः जांचें।`
            : `The entered age (${enteredAge}) appears inconsistent with the selected date of birth (Birth year: ${birthYear}). Please double-check.`,
      });
    }
  }

  // 2. PIN Code vs State Check
  if (formData.pincode && formData.state) {
    const pin = formData.pincode.toString().trim();
    const state = formData.state.toLowerCase();
    // Maharashtra PIN codes start with 40, 41, 42, 43, 44
    if (state.includes('maharashtra') && pin.length === 6 && !pin.startsWith('4')) {
      warnings.push({
        field: 'pincode',
        message: lang === 'mr'
          ? 'महाराष्ट्रातील पिनकोड साधारणपणे ४ ने सुरू होतात. कृपया पिनकोड तपासा.'
          : lang === 'hi'
            ? 'महाराष्ट्र के पिनकोड आमतौर पर 4 से शुरू होते हैं। कृपया पिनकोड की पुष्टि करें।'
            : 'Maharashtra PIN codes typically begin with digit "4". Please verify your 6-digit postal code.',
      });
    }
  }

  return {
    hasWarnings: warnings.length > 0,
    warnings,
  };
}

/**
 * Evaluates uploaded documents against mandatory service checklist
 */
export function getDocumentChecklist(serviceId, uploadedFiles = [], language = 'en') {
  const service = GOVERNMENT_SERVICES.find(s => s.id === serviceId) || GOVERNMENT_SERVICES[0];
  const lang = language || 'en';

  const uploadedNames = uploadedFiles.map(f => (typeof f === 'string' ? f : f.name || '').toLowerCase());

  const checklist = service.documentsRequired.map(doc => {
    const docLow = doc.name.toLowerCase();
    const isUploaded = uploadedNames.some(u => docLow.split(' ')[0].length > 3 && u.includes(docLow.split(' ')[0]));

    return {
      name: doc.name,
      whyRequired: doc.whyRequired,
      isMandatory: doc.isMandatory,
      status: isUploaded ? 'UPLOADED' : doc.isMandatory ? 'MISSING' : 'OPTIONAL',
    };
  });

  const missingMandatory = checklist.filter(c => c.status === 'MISSING');

  return {
    serviceName: service.name,
    totalRequired: service.documentsRequired.length,
    checklist,
    isComplete: missingMandatory.length === 0,
    missingCount: missingMandatory.length,
    summary: missingMandatory.length === 0
      ? (lang === 'mr' ? 'सर्व आवश्यक कागदपत्रे जोडण्यात आली आहेत.' : 'All required mandatory documents are ready for submission.')
      : (lang === 'mr' ? `कृपया उर्वरित ${missingMandatory.length} आवश्यक कागदपत्रे जोडा.` : `Please attach the ${missingMandatory.length} missing mandatory document(s) before final submission.`),
  };
}

/**
 * Intelligent Citizen Dashboard Summary
 */
export function generateDashboardSummary(user, complaints = [], language = 'en') {
  const lang = language || 'en';
  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  let summaryText = '';
  if (total === 0) {
    summaryText = lang === 'mr'
      ? 'आपल्याकडे सध्या कोणतीही सक्रिय तक्रार किंवा अर्ज प्रलंबित नाही. नवीन सेवेसाठी आपण सहज अर्ज करू शकता.'
      : lang === 'hi'
        ? 'आपके पास वर्तमान में कोई सक्रिय शिकायत या आवेदन लंबित नहीं है। आप किसी भी सेवा के लिए आवेदन कर सकते हैं।'
        : 'You have no active grievances or applications pending. You can search or apply for civic and government services at any time.';
  } else {
    summaryText = lang === 'mr'
      ? `आपल्याकडे एकूण ${total} अर्ज असून ${inProgress} प्रगतीपथावर आहेत आणि ${pending} पडताळणी अंतर्गत आहेत. ${resolved} तक्रारी यशस्वीरीत्या सोडवण्यात आल्या आहेत.`
      : lang === 'hi'
        ? `आपके कुल ${total} आवेदनों में से ${inProgress} प्रगति पर हैं और ${pending} सत्यापन में हैं। ${resolved} शिकायतों का समाधान हो चुका है।`
        : `You have ${total} total submission(s): ${inProgress} in active resolution and ${pending} under administrative review. ${resolved} grievance(s) have been successfully resolved.`;
  }

  // Identify actionable items (e.g. resolved items needing citizen confirmation or pending items needing docs)
  const actionRequiredItems = complaints
    .filter(c => c.status === 'Resolved' || c.status === 'Submitted')
    .slice(0, 3)
    .map(c => ({
      id: c.id,
      title: c.title,
      department: c.department,
      status: c.status,
      actionText: c.status === 'Resolved' ? 'Confirm Resolution & Give Feedback' : 'Verify Tracking Timeline',
      actionUrl: `/complaints/${c.id}`,
      severity: c.status === 'Resolved' ? 'success' : 'attention',
    }));

  return {
    total,
    pending,
    inProgress,
    resolved,
    summaryText,
    actionRequiredCount: actionRequiredItems.length,
    actionRequiredItems,
  };
}

/**
 * Generates personalized service recommendations based on citizen activity
 */
export function getServiceRecommendations(complaints = [], language = 'en') {
  const categoriesPresent = new Set(complaints.map(c => c.category));

  // Default recommendations
  const recommended = GOVERNMENT_SERVICES.filter(s => {
    if (categoriesPresent.has('Road Infrastructure') && s.id === 'srv-electricity') return true;
    if (categoriesPresent.has('Water Supply') && s.id === 'srv-sanitation') return true;
    return s.id === 'srv-domicile' || s.id === 'srv-income';
  }).slice(0, 3);

  return recommended.map(s => ({
    id: s.id,
    name: language === 'mr' ? s.marathiName : language === 'hi' ? s.hindiName : s.name,
    category: s.category,
    department: s.department,
    processingTime: s.processingTime,
    applicationUrl: s.applicationUrl,
    rationale: language === 'mr'
      ? 'नागरिकांच्या दैनंदिन गरजेनुसार ही सेवा अत्यंत उपयुक्त आहे.'
      : 'Highly requested service for citizens in your district.',
  }));
}

export default {
  detectLanguage,
  sanitizeAndGuardPrompt,
  classifyIntent,
  searchServicesSemantic,
  processCitizenChat,
  explainComplaintStatus,
  explainFormField,
  validateFormConsistency,
  getDocumentChecklist,
  generateDashboardSummary,
  getServiceRecommendations,
};
