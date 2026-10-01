/**
 * Official Maharashtra Government Civic & Citizen Services Knowledge Base
 * Authoritative source of truth for RAG semantic search and AI assistance.
 * Supports English, Marathi (मराठी), and Hindi (हिन्दी).
 */

export const GOVERNMENT_SERVICES = [
  {
    id: 'srv-domicile',
    name: 'Domicile & Nationality Certificate',
    marathiName: 'अधिवास व राष्ट्रीयत्व प्रमाणपत्र',
    hindiName: 'अधिवास और राष्ट्रीयता प्रमाण पत्र',
    department: 'Revenue & District Administration',
    category: 'Certificates & Identification',
    description:
      'Official certificate issued by the Government of Maharashtra proving that a citizen has continuously resided in the state for at least 15 years and is an Indian citizen.',
    marathiDescription:
      'महाराष्ट्र शासनाकडून दिले जाणारे अधिकृत प्रमाणपत्र, जे नागरिक राज्यात किमान १५ वर्षांपासून वास्तव्यास असल्याचे आणि भारतीय नागरिक असल्याचे सिद्ध करते.',
    hindiDescription:
      'महाराष्ट्र सरकार द्वारा जारी आधिकारिक प्रमाण पत्र, जो यह प्रमाणित करता है कि नागरिक कम से कम 15 वर्षों से राज्य में निवास कर रहा है।',
    eligibility: [
      'Applicant must be an Indian citizen.',
      'Continuous residence in Maharashtra for a minimum of 15 years.',
      'Minors can apply through their legal guardian.',
    ],
    documentsRequired: [
      {
        name: 'Proof of Identity (Aadhaar Card / Voter ID / PAN Card)',
        whyRequired: 'Required by government rules to verify the legal identity and citizenship of the applicant.',
        isMandatory: true,
      },
      {
        name: 'Proof of Residence (Electricity Bill / Ration Card / Rent Agreement)',
        whyRequired: 'Required to authenticate the current residential address within Maharashtra.',
        isMandatory: true,
      },
      {
        name: 'School Leaving Certificate / Bonafide Certificate',
        whyRequired: 'Required to establish continuous 15-year education or historical residence in the state.',
        isMandatory: true,
      },
      {
        name: 'Self-Declaration Affidavit (Form 1)',
        whyRequired: 'Legal undertaking affirming all provided personal statements are true under Indian law.',
        isMandatory: true,
      },
      {
        name: 'Passport-sized Photograph',
        whyRequired: 'Affixed to the physical and digital digitally-signed government certificate.',
        isMandatory: true,
      },
    ],
    fees: '₹50 standard government processing fee (inclusive of GST). No hidden charges.',
    processingTime: '7 to 15 working days under the Maharashtra Right to Public Services Act (RTS).',
    applicationUrl: '/services/apply/domicile',
    keywords: [
      'domicile', 'residence proof', 'nationality', 'adivas', 'stay in maharashtra',
      'proof that i live in maharashtra', '15 years stay', 'living proof',
      'अधिवास', 'रहिवासी', 'दाखला', 'प्रमाणपत्र', 'निवास', 'रहवासी प्रमाण'
    ],
    journeySteps: [
      'Check Eligibility: Confirm 15 years continuous residence in Maharashtra',
      'Prepare Documents: Gather Aadhaar, Electricity Bill, and School Leaving Certificate',
      'Fill Application Form: Enter personal information and residential history',
      'Upload Verification Documents: Upload scanned PDF/JPEG files under 5MB',
      'Fee Payment: Pay ₹50 government statutory processing fee',
      'Tahsildar Verification: Document scrutiny and ground verification by Talathi',
      'Download Digitally Signed Certificate: Download barcoded certificate from portal',
    ],
    faqs: [
      {
        q: 'How long is the Domicile Certificate valid?',
        a: 'The Domicile Certificate is valid for a lifetime and does not require annual renewal.',
      },
      {
        q: 'Can a married woman get a domicile certificate in Maharashtra?',
        a: 'Yes, married women can apply based on their husband’s 15-year domicile proof or their own continuous residence.',
      },
    ],
  },
  {
    id: 'srv-income',
    name: 'Income Certificate (Tahsil Office)',
    marathiName: 'उत्पन्न प्रमाणपत्र (तहसील कार्यालय)',
    hindiName: 'आय प्रमाण पत्र (तहसील कार्यालय)',
    department: 'Revenue & District Administration',
    category: 'Revenue & Social Welfare',
    description:
      'Official financial certificate certifying the total annual income of a family from all legitimate sources for scholarships, subsidies, and government schemes.',
    marathiDescription:
      'विविध शासकीय योजना, शिष्यवृत्ती आणि सवलतींसाठी कुटुंबाचे सर्व स्रोतांकडून मिळणारे वार्षिक उत्पन्न प्रमाणित करणारा अधिकृत दाखला.',
    hindiDescription:
      'छात्रवृत्ति, सब्सिडी और सरकारी योजनाओं के लिए परिवार की कुल वार्षिक आय को प्रमाणित करने वाला आधिकारिक प्रमाण पत्र।',
    eligibility: [
      'Resident of the concerned district in Maharashtra.',
      'Salaried, business, agricultural, or daily wage earners.',
    ],
    documentsRequired: [
      {
        name: 'Proof of Identity (Aadhaar Card)',
        whyRequired: 'Verifies applicant identity against UIDAI records.',
        isMandatory: true,
      },
      {
        name: 'Salary Slip / Form 16 / Income Tax Return (ITR)',
        whyRequired: 'Provides documentary evidence of earnings for salaried or professional individuals.',
        isMandatory: true,
      },
      {
        name: 'Talathi Income Verification Report (For rural/unorganized sector)',
        whyRequired: 'Field verification report for farmers or unorganized sector workers without Form 16.',
        isMandatory: false,
      },
      {
        name: 'Ration Card',
        whyRequired: 'Confirms total family members dependent on the stated household income.',
        isMandatory: true,
      },
    ],
    fees: '₹33 standard statutory government fee.',
    processingTime: '7 to 15 working days under RTS Act.',
    applicationUrl: '/services/apply/income',
    keywords: [
      'income', 'salary proof', 'annual earnings', 'scholarship income', 'tahsildar income',
      'financial help for education', 'ebc certificate', 'financial assistance',
      'उत्पन्न', 'उत्पन्नाचा दाखला', 'कमाई', 'आय', 'आय प्रमाण पत्र'
    ],
    journeySteps: [
      'Determine Income Year: Select financial year for assessment',
      'Gather Financial Records: Collect salary slips, bank statement, or Form 16',
      'Submit Application: Complete citizen details and household member counts',
      'Verification: Local Talathi or Naib Tahsildar reviews declaration',
      'Receive Certificate: Download digitally signed certificate with QR code',
    ],
    faqs: [
      {
        q: 'What is the validity period of an Income Certificate in Maharashtra?',
        a: 'Income certificates are issued for either 1 year or 3 financial years, depending on the scheme requirement.',
      },
    ],
  },
  {
    id: 'srv-caste',
    name: 'Caste Certificate & Validity',
    marathiName: 'जात प्रमाणपत्र व जात पडताळणी',
    hindiName: 'जाति प्रमाण पत्र और सत्यापन',
    department: 'Social Justice & Special Assistance',
    category: 'Certificates & Identification',
    description:
      'Official proof that an applicant belongs to a recognized Scheduled Caste (SC), Scheduled Tribe (ST), VJNT, OBC, or SBC category in Maharashtra.',
    marathiDescription:
      'अर्जदार महाराष्ट्रातील शासनमान्य अनुसूचित जाती, जमाती, विमुक्त जाती, भटक्या जमाती किंवा इतर मागासवर्गातील असल्याचा अधिकृत पुरावा.',
    hindiDescription:
      'आधिकारिक प्रमाण पत्र जो प्रमाणित करता है कि आवेदक महाराष्ट्र में अनुसूचित जाति, जनजाति, ओबीसी या अन्य मान्यता प्राप्त वर्ग से संबंधित है।',
    eligibility: [
      'Applicant or ancestors must be permanent residents of Maharashtra prior to the presidential order deemed dates (e.g. 1961 for SC/ST, 1967 for OBC).',
    ],
    documentsRequired: [
      {
        name: 'Applicant Aadhaar Card',
        whyRequired: 'Validates applicant identity.',
        isMandatory: true,
      },
      {
        name: 'School Leaving Certificate mentioning Caste & Religion',
        whyRequired: 'Crucial historical school record confirming caste category.',
        isMandatory: true,
      },
      {
        name: 'Father / Grandfather School Leaving Certificate or Record prior to 1967/1961',
        whyRequired: 'Mandatory statutory proof establishing genealogical lineage and caste history in Maharashtra.',
        isMandatory: true,
      },
      {
        name: 'Genealogy Affidavit (Vanshavali)',
        whyRequired: 'Detailed family tree connecting applicant directly to paternal blood relatives.',
        isMandatory: true,
      },
    ],
    fees: '₹50 government fee.',
    processingTime: '21 to 45 working days due to statutory scrutiny committee verification.',
    applicationUrl: '/services/apply/caste',
    keywords: [
      'caste', 'jaat pramanpatra', 'obc', 'sc', 'st', 'vjnt', 'sbc', 'caste validity',
      'reservations', 'caste certificate', 'जात', 'जातीचा दाखला', 'जाति'
    ],
    journeySteps: [
      'Document Check: Verify pre-deemed date paternal blood relative records',
      'Draft Family Tree: Create signed genealogy undertaking (Vanshavali)',
      'Submit Form: File application with Sub-Divisional Officer (SDO)',
      'Scrutiny Committee: Document verification and vigilance cell inquiry if needed',
      'Issuance: SDO issues digitally signed Caste Certificate',
    ],
    faqs: [
      {
        q: 'Can caste certificate be issued based on maternal relatives in Maharashtra?',
        a: 'Under Maharashtra State rules, caste is determined strictly through paternal lineage (father, grandfather, paternal uncle).',
      },
    ],
  },
  {
    id: 'srv-birth',
    name: 'Birth Certificate Registration & Issuance',
    marathiName: 'जन्म नोंदणी व जन्म प्रमाणपत्र',
    hindiName: 'जन्म पंजीकरण और जन्म प्रमाण पत्र',
    department: 'Public Health & Municipal Corporation',
    category: 'Vital Statistics',
    description:
      'Official civil registration document recording the birth of a child, issued under the Registration of Births and Deaths Act.',
    marathiDescription:
      'जन्म आणि मृत्यू नोंदणी कायद्यांतर्गत बालकाच्या जन्माची नोंद करून महापालिका किंवा ग्रामपंचायतीमार्फत दिला जाणारा अधिकृत दाखला.',
    hindiDescription:
      'जन्म और मृत्यु पंजीकरण अधिनियम के तहत बच्चे के जन्म को पंजीकृत करने वाला आधिकारिक नागरिक दस्तावेज।',
    eligibility: [
      'Birth occurred within the jurisdiction of Maharashtra Municipal Corporation or Gram Panchayat.',
      'Registration within 21 days is free of delayed penalties.',
    ],
    documentsRequired: [
      {
        name: 'Hospital / Nursing Home Discharge Summary / Form 1',
        whyRequired: 'Official medical verification of date, time, and sex of birth issued by attending doctor.',
        isMandatory: true,
      },
      {
        name: 'Parents’ Aadhaar Cards & Marriage Proof',
        whyRequired: 'Verifies parentage and legal identity for birth record register.',
        isMandatory: true,
      },
      {
        name: 'Address Proof of Parents',
        whyRequired: 'Confirms permanent and residential address at the time of birth.',
        isMandatory: true,
      },
    ],
    fees: 'Free within 21 days. Nominal late fee of ₹20-₹50 for delayed registrations up to 1 year.',
    processingTime: '3 to 7 working days.',
    applicationUrl: '/services/apply/birth',
    keywords: [
      'birth', 'born', 'newborn baby', 'baby birth certificate', 'register my birth',
      'birth proof', 'janma dakhla', 'जन्म', 'जन्माचा दाखला', 'जन्म प्रमाण पत्र'
    ],
    journeySteps: [
      'Hospital Intimation: Hospital files birth report with Municipal Corporation',
      'Name Addition: Parents enter child name online or at ward office',
      'Verification: Medical Officer of Health approves register entry',
      'Issuance: Download barcode-verified Birth Certificate',
    ],
    faqs: [
      {
        q: 'Can I add child name later after initial birth registration?',
        a: 'Yes, child name can be updated online within 12 months without fee, and up to 15 years with prescribed fee.',
      },
    ],
  },
  {
    id: 'srv-pothole-road',
    name: 'Road Infrastructure & Pothole Repair Grievance',
    marathiName: 'रस्ते दुरुस्ती व खड्डे निवारण तक्रार',
    hindiName: 'सड़क मरम्मत और गड्ढा शिकायत',
    department: 'Road Maintenance & Public Works Department (PWD)',
    category: 'Civic Infrastructure',
    description:
      'Civic grievance service for reporting dangerous potholes, broken footpaths, damaged asphalt, missing manhole covers, and road construction defects across Maharashtra.',
    marathiDescription:
      'रस्त्यांवरील खड्डे, फुटपाथची दुरवस्था, उघडी गटारे आणि डांबरीकरणातील त्रुटींची तक्रार करून तातडीने दुरुस्ती करून घेण्याची सेवा.',
    hindiDescription:
      'सड़कों के गड्ढों, टूटे फुटपाथों और सड़क निर्माण दोषों की रिपोर्ट करने और मरम्मत कराने की नागरिक सेवा।',
    eligibility: ['Any citizen traveling or residing in Maharashtra.'],
    documentsRequired: [
      {
        name: 'Geo-tagged Photograph of the Pothole / Road Obstruction',
        whyRequired: 'Enables highway and ward engineers to pinpoint location and mobilize repair machinery.',
        isMandatory: true,
      },
      {
        name: 'Exact GPS Location or Street Address',
        whyRequired: 'Routes complaint automatically to the responsible ward executive engineer.',
        isMandatory: true,
      },
    ],
    fees: '100% Free citizen grievance service. No fee.',
    processingTime: '24 to 72 hours SLA under Public Works Rapid Response Protocol.',
    applicationUrl: '/complaints/new?category=Road Infrastructure',
    keywords: [
      'pothole', 'road damage', 'broken road', 'footpath', 'asphalt', 'speed breaker',
      'pothole on road', 'fix road', 'pothole repair', 'रस्ता', 'खड्डा', 'सड़क', 'गड्ढा'
    ],
    journeySteps: [
      'Capture Photo: Take a clear photo of the pothole showing surrounding landmarks',
      'Lodge Grievance: Submit GPS location and description through portal',
      'Automated Assignment: System assigns ticket to Division Sub-Engineer within 4 hours',
      'On-site Repair: Road contractor applies cold/hot mix asphalt',
      'Citizen Verification: Officer uploads completion photo; citizen confirms closure',
    ],
    faqs: [
      {
        q: 'What is the SLA deadline for fixing dangerous potholes in Mumbai/Pune?',
        a: 'Critical potholes on arterial roads must be filled within 24 to 48 hours according to municipal guidelines.',
      },
    ],
  },
  {
    id: 'srv-water-supply',
    name: 'Drinking Water Supply & Contamination Grievance',
    marathiName: 'पिण्याच्या पाण्याचा पुरवठा व दूषित पाणी तक्रार',
    hindiName: 'पेयजल आपूर्ति और दूषित जल शिकायत',
    department: 'Water Supply & Sewerage Department',
    category: 'Civic Utilities',
    description:
      'Emergency civic service for reporting zero water supply, low water pressure, contaminated/muddy drinking water, and municipal pipeline bursts.',
    marathiDescription:
      'कमी दाबाने पाणी येणे, दूषित किंवा गढूळ पाणी पुरवठा, जलवाहिनी फुटणे अथवा पाणी न येणे याविषयी तातडीची तक्रार सेवा.',
    hindiDescription:
      'कम दबाव, दूषित जल, पाइपलाइन फटने या जलापूर्ति न होने की आपातकालीन नागरिक शिकायत सेवा।',
    eligibility: ['Residents of Maharashtra urban or rural local bodies with municipal water supply.'],
    documentsRequired: [
      {
        name: 'Consumer Water Meter / Connection Number (Optional)',
        whyRequired: 'Assists pipeline engineers in identifying the specific distribution valve and pressure zone.',
        isMandatory: false,
      },
      {
        name: 'Location Address & Contact Number',
        whyRequired: 'Enables field water inspector to collect water samples for laboratory purity testing.',
        isMandatory: true,
      },
    ],
    fees: 'Free public utility service.',
    processingTime: '24 hours for contamination / bursts; 48 hours for pressure stabilization.',
    applicationUrl: '/complaints/new?category=Water Supply',
    keywords: [
      'water', 'no water', 'contaminated water', 'pipeline leak', 'dirty water', 'water pressure',
      'water supply', 'drinking water', 'पाणी', 'पाणी पुरवठा', 'दूषित पाणी', 'जल'
    ],
    journeySteps: [
      'Lodge Emergency Request: Select Water Supply category and indicate severity',
      'Immediate Dispatch: Valve-man or water inspector investigates distribution network',
      'Testing: Water sample tested for chlorine residual if contamination reported',
      'Resolution: Leak rectified or water tanker mobilized if pipeline repair takes time',
    ],
    faqs: [
      {
        q: 'What happens if municipal water pipeline bursts?',
        a: 'Pipeline burst emergency complaints trigger immediate water diversion and repair within 12 hours.',
      },
    ],
  },
  {
    id: 'srv-electricity',
    name: 'Streetlight & Electricity Grievance (MSEDCL / BEST / Adani)',
    marathiName: 'विद्युत व पथदिवे तक्रार निवारण',
    hindiName: 'विद्युत और स्ट्रीटलाइट शिकायत निवारण',
    department: 'Electricity & Energy Department',
    category: 'Civic Utilities',
    description:
      'Grievance redressal for malfunctioning streetlights, hanging live wires, frequent power fluctuations, and transformer issues.',
    marathiDescription:
      'बंद पथदिवे, लोंबकळणाऱ्या धोकादायक वीज तारा, वारंवार वीज खंडित होणे किंवा ट्रान्सफॉर्मर बिघाड यासाठी तक्रार सेवा.',
    hindiDescription:
      'खराब स्ट्रीटलाइट, खतरनाक लटकते बिजली के तार या बार-बार बिजली गुल होने की शिकायत सेवा।',
    eligibility: ['All electricity consumers and pedestrians in Maharashtra.'],
    documentsRequired: [
      {
        name: 'Street / Pole Number or Consumer Number',
        whyRequired: 'Helps maintenance staff locate the exact pole or distribution box in the locality.',
        isMandatory: false,
      },
      {
        name: 'Photo of Danger or Dark Street (Optional)',
        whyRequired: 'Verifies safety hazard.',
        isMandatory: false,
      },
    ],
    fees: 'Free service.',
    processingTime: '24 hours for dark streetlights; 2 hours for dangerous live wire emergencies.',
    applicationUrl: '/complaints/new?category=Electricity',
    keywords: [
      'electricity', 'streetlight', 'power outage', 'current gone', 'wire hanging', 'dark street',
      'light not working', 'विद्युत', 'पथदिवा', 'लाईट', 'बिजली'
    ],
    journeySteps: [
      'Submit Pole Location: Provide street name and nearest pole number',
      'Wireman Dispatched: Maintenance team visits with replacement LED bulb or cable',
      'Restoration: Streetlight restored and tested in night trial',
    ],
    faqs: [
      {
        q: 'How fast are dangerous dangling wires fixed?',
        a: 'Live dangling wires are flagged as emergency hazards and safety teams respond within 2 hours.',
      },
    ],
  },
  {
    id: 'srv-sanitation',
    name: 'Garbage Collection & Public Sanitation Grievance',
    marathiName: 'कचरा व्यवस्थापन व स्वच्छता तक्रार',
    hindiName: 'कचरा प्रबंधन और सार्वजनिक स्वच्छता शिकायत',
    department: 'Sanitation & Solid Waste Management (SWM)',
    category: 'Civic Utilities',
    description:
      'Citizens can report uncollected household garbage, overflowed public dustbins, illegal debris dumping, and dirty public toilets.',
    marathiDescription:
      'वेळेवर कचरा न उचलणे, ओसंडून वाहणारे कचराकुंडी, रस्त्यावरील अस्वच्छता आणि तुंबलेली गटारे याविषयी तक्रार निवारण सेवा.',
    hindiDescription:
      'कचरा न उठना, सार्वजनिक कूड़ेदान का भर जाना, और गंदगी की रिपोर्ट करने की नागरिक सेवा।',
    eligibility: ['All residents and shopkeepers in Maharashtra.'],
    documentsRequired: [
      {
        name: 'Photo of Garbage Pile / Overflowing Bin',
        whyRequired: 'Allows Sanitation Inspector to deploy the appropriate tipper truck or cleaning squad.',
        isMandatory: true,
      },
    ],
    fees: 'Free service.',
    processingTime: '12 to 24 hours SLA.',
    applicationUrl: '/complaints/new?category=Sanitation',
    keywords: [
      'garbage', 'waste', 'trash', 'sanitation', 'dirty road', 'dustbin overflow', 'smell',
      'swachh bharat', 'कचरा', 'घाण', 'सफाई', 'कचरापेटी', 'कूड़ा'
    ],
    journeySteps: [
      'Report Location: Take photo and submit street name',
      'Tipper Truck Dispatched: Waste management contractor clears the site',
      'Disinfection: Area disinfected with bleaching powder',
      'Closure: Cleaned site photo sent to citizen for satisfaction rating',
    ],
    faqs: [
      {
        q: 'Can I report illegal construction debris dumping?',
        a: 'Yes, select Sanitation -> Debris & Construction Waste for specialized dumper truck dispatch.',
      },
    ],
  },
  {
    id: 'srv-ration-card',
    name: 'Ration Card (NFSA / APL / BPL) Application & Member Addition',
    marathiName: 'रेशन कार्ड अर्ज व नवीन नाव समाविष्ट करणे',
    hindiName: 'राशन कार्ड आवेदन और नया नाम जोड़ना',
    department: 'Food, Civil Supplies & Consumer Protection',
    category: 'Social Welfare & Subsidies',
    description:
      'Issuance of new digitized smart ration cards, adding newborn child or spouse names, and address transfer under Public Distribution System (PDS).',
    marathiDescription:
      'नवीन डिजिटल शिधापत्रिका (रेशन कार्ड) मिळवणे, कुटुंबातील सदस्यांची नावे वाढवणे अथवा पत्ता बदलण्याची अधिकृत सेवा.',
    hindiDescription:
      'नया डिजिटल राशन कार्ड बनवाने, परिवार के सदस्यों का नाम जोड़ने या पता बदलने की आधिकारिक सेवा।',
    eligibility: ['Families permanently residing in Maharashtra without an existing active ration card elsewhere in India.'],
    documentsRequired: [
      {
        name: 'Aadhaar Cards of All Family Members',
        whyRequired: 'Mandatory Aadhaar-seeding required under One Nation One Ration Card (ONORC) scheme.',
        isMandatory: true,
      },
      {
        name: 'Income Certificate / Proof of Earnings',
        whyRequired: 'Determines entitlement category: Antyodaya (AAY), Priority Household (BPL), or White card (APL).',
        isMandatory: true,
      },
      {
        name: 'Proof of Residence (Electricity Bill / Index 2 Property Tax)',
        whyRequired: 'Maps household to nearest Fair Price Shop (FPS) distributor.',
        isMandatory: true,
      },
    ],
    fees: '₹20 to ₹50 statutory fee.',
    processingTime: '15 to 30 working days.',
    applicationUrl: '/services/apply/ration-card',
    keywords: [
      'ration', 'food grains', 'wheat', 'rice', 'pds', 'ration card', 'add member to ration',
      'ration dakhla', 'रेशन', 'रेशन कार्ड', 'शिधापत्रिका', 'राशन कार्ड'
    ],
    journeySteps: [
      'Determine Card Type: Antyodaya, BPL, or APL based on annual family income',
      'Upload Family Aadhaar: Seed Aadhaar for all adults and children',
      'FPS Allocation: System assigns nearest Fair Price Shop based on address',
      'Verification: Supply Inspector reviews documentation',
      'Card Ready: Collect biometric smart ration card',
    ],
    faqs: [
      {
        q: 'Can I use Maharashtra ration card in other states?',
        a: 'Yes, under the One Nation One Ration Card (ONORC) program, your biometric ration card is portable across India.',
      },
    ],
  },
];

export default GOVERNMENT_SERVICES;
