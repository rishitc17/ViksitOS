// ViksitOS Configuration
// Replace with your Supabase project credentials

const SUPABASE_CONFIG = {
    url: 'https://vuaqdbwqccgrbdonfuxc.supabase.co',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YXFkYndxY2NncmJkb25mdXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzU1NzQsImV4cCI6MjA5NDkxMTU3NH0.w3iQunXvH51537Dlev8C4Kljtt4z5LR3shzPGmpmn3w',
};

// Service types available for application
const SERVICE_TYPES = {
    certificates: {
        label: 'Certificates',
        icon: 'fa-certificate',
        services: [
            { id: 'birth_certificate', name: 'Birth Certificate', icon: 'fa-baby' },
            { id: 'death_certificate', name: 'Death Certificate', icon: 'fa-cross' },
            { id: 'marriage_certificate', name: 'Marriage Certificate', icon: 'fa-heart' },
            { id: 'residence_certificate', name: 'Residence Certificate', icon: 'fa-house-chimney' },
            { id: 'income_certificate', name: 'Income Certificate', icon: 'fa-indian-rupee-sign' },
            { id: 'caste_certificate', name: 'Caste Certificate', icon: 'fa-id-card' },
            { id: 'domicile_certificate', name: 'Domicile Certificate', icon: 'fa-map-location-dot' },
            { id: 'survival_certificate', name: 'Survival Certificate', icon: 'fa-heart-pulse' },
        ],
    },
    updates: {
        label: 'Document Updates',
        icon: 'fa-pen-to-square',
        services: [
            { id: 'aadhar_update', name: 'Aadhar Card Update', icon: 'fa-fingerprint' },
            { id: 'pan_update', name: 'PAN Card Update', icon: 'fa-id-badge' },
            { id: 'voter_id_update', name: 'Voter ID Update', icon: 'fa-check-to-slot' },
            { id: 'passport_update', name: 'Passport Update', icon: 'fa-passport' },
            { id: 'ration_card_update', name: 'Ration Card Update', icon: 'fa-credit-card' },
        ],
    },
    licenses: {
        label: 'Licenses & Permits',
        icon: 'fa-file-signature',
        services: [
            { id: 'driving_license', name: 'Driving License', icon: 'fa-car' },
            { id: 'trade_license', name: 'Trade License', icon: 'fa-shop' },
            { id: 'building_permit', name: 'Building Permit', icon: 'fa-helmet-safety' },
            { id: 'business_license', name: 'Business License', icon: 'fa-briefcase' },
        ],
    },
};

// Form fields for each service type
const SERVICE_FORMS = {
    birth_certificate: [
        { name: 'child_name', label: "Child's Full Name", type: 'text', required: true },
        { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
        { name: 'place_of_birth', label: 'Place of Birth', type: 'text', required: true },
        { name: 'father_name', label: "Father's Name", type: 'text', required: true },
        { name: 'mother_name', label: "Mother's Name", type: 'text', required: true },
        { name: 'address', label: 'Permanent Address', type: 'textarea', required: true },
    ],
    death_certificate: [
        { name: 'deceased_name', label: "Deceased's Full Name", type: 'text', required: true },
        { name: 'dod', label: 'Date of Death', type: 'date', required: true },
        { name: 'place_of_death', label: 'Place of Death', type: 'text', required: true },
        { name: 'cause_of_death', label: 'Cause of Death', type: 'text', required: true },
        { name: 'applicant_name', label: "Applicant's Name", type: 'text', required: true },
        { name: 'relation', label: 'Relation to Deceased', type: 'text', required: true },
    ],
    marriage_certificate: [
        { name: 'groom_name', label: "Groom's Full Name", type: 'text', required: true },
        { name: 'bride_name', label: "Bride's Full Name", type: 'text', required: true },
        { name: 'marriage_date', label: 'Date of Marriage', type: 'date', required: true },
        { name: 'marriage_place', label: 'Place of Marriage', type: 'text', required: true },
        { name: 'witness_1', label: 'Witness 1 Name', type: 'text', required: true },
        { name: 'witness_2', label: 'Witness 2 Name', type: 'text', required: true },
    ],
    residence_certificate: [
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'father_name', label: "Father's Name", type: 'text', required: true },
        { name: 'address', label: 'Current Address', type: 'textarea', required: true },
        { name: 'years_at_address', label: 'Years at Current Address', type: 'number', required: true },
        { name: 'district', label: 'District', type: 'text', required: true },
        { name: 'state', label: 'State', type: 'text', required: true, default: 'Current State' },
        { name: 'pincode', label: 'PIN Code', type: 'text', required: true },
    ],
    income_certificate: [
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'father_name', label: "Father's Name", type: 'text', required: true },
        { name: 'annual_income', label: 'Annual Income (Rs.)', type: 'number', required: true },
        { name: 'income_source', label: 'Source of Income', type: 'text', required: true },
        { name: 'address', label: 'Address', type: 'textarea', required: true },
        { name: 'occupation', label: 'Occupation', type: 'text', required: true },
    ],
    caste_certificate: [
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'father_name', label: "Father's Name", type: 'text', required: true },
        { name: 'caste', label: 'Caste', type: 'text', required: true },
        { name: 'sub_caste', label: 'Sub-Caste', type: 'text', required: false },
        { name: 'address', label: 'Address', type: 'textarea', required: true },
        { name: 'district', label: 'District', type: 'text', required: true },
    ],
    domicile_certificate: [
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'father_name', label: "Father's Name", type: 'text', required: true },
        { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
        { name: 'state', label: 'State of Domicile', type: 'text', required: true },
        { name: 'address', label: 'Address', type: 'textarea', required: true },
        { name: 'years_in_state', label: 'Years in State', type: 'number', required: true },
    ],
    survival_certificate: [
        { name: 'pensioner_name', label: "Pensioner's Full Name", type: 'text', required: true },
        { name: 'pension_account', label: 'Pension Account Number', type: 'text', required: true },
        { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
        { name: 'address', label: 'Current Address', type: 'textarea', required: true },
        { name: 'certificate_date', label: 'Certificate Date', type: 'date', required: true },
    ],
    aadhar_update: [
        { name: 'aadhar_number', label: 'Aadhar Number', type: 'text', required: true, placeholder: 'XXXX XXXX XXXX' },
        {
            name: 'update_type',
            label: 'Update Type',
            type: 'select',
            options: ['Name Change', 'Address Change', 'DOB Change', 'Mobile Update', 'Email Update'],
            required: true,
        },
        { name: 'current_value', label: 'Current Value', type: 'text', required: true },
        { name: 'new_value', label: 'New Value', type: 'text', required: true },
        { name: 'reason', label: 'Reason for Update', type: 'textarea', required: true },
    ],
    pan_update: [
        { name: 'pan_number', label: 'PAN Number', type: 'text', required: true, placeholder: 'ABCDE1234F' },
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        {
            name: 'update_type',
            label: 'Update Type',
            type: 'select',
            options: ['Name Correction', 'Address Change', 'DOB Correction', 'Photo Update'],
            required: true,
        },
        { name: 'details', label: 'Update Details', type: 'textarea', required: true },
    ],
    voter_id_update: [
        { name: 'voter_id', label: 'Voter ID Number', type: 'text', required: true },
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        {
            name: 'update_type',
            label: 'Update Type',
            type: 'select',
            options: ['Address Change', 'Name Correction', 'Photo Update', 'Constituency Change'],
            required: true,
        },
        { name: 'details', label: 'Update Details', type: 'textarea', required: true },
    ],
    passport_update: [
        { name: 'passport_number', label: 'Passport Number', type: 'text', required: true },
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        {
            name: 'update_type',
            label: 'Update Type',
            type: 'select',
            options: ['Name Change', 'Address Change', 'Spouse Name Add', 'Validity Extension'],
            required: true,
        },
        { name: 'details', label: 'Update Details', type: 'textarea', required: true },
    ],
    ration_card_update: [
        { name: 'ration_card_number', label: 'Ration Card Number', type: 'text', required: true },
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        {
            name: 'update_type',
            label: 'Update Type',
            type: 'select',
            options: ['Add Member', 'Remove Member', 'Address Change', 'Name Correction'],
            required: true,
        },
        { name: 'details', label: 'Update Details', type: 'textarea', required: true },
    ],
    driving_license: [
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
        { name: 'address', label: 'Address', type: 'textarea', required: true },
        {
            name: 'license_type',
            label: 'License Type',
            type: 'select',
            options: ['Two Wheeler', 'Four Wheeler', 'Commercial', 'International'],
            required: true,
        },
        {
            name: 'blood_group',
            label: 'Blood Group',
            type: 'select',
            options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            required: true,
        },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
    ],
    trade_license: [
        { name: 'business_name', label: 'Business Name', type: 'text', required: true },
        { name: 'owner_name', label: "Owner's Name", type: 'text', required: true },
        { name: 'business_address', label: 'Business Address', type: 'textarea', required: true },
        { name: 'business_type', label: 'Business Type', type: 'text', required: true },
        { name: 'start_date', label: 'Business Start Date', type: 'date', required: true },
        { name: 'employees', label: 'Number of Employees', type: 'number', required: true },
    ],
    building_permit: [
        { name: 'applicant_name', label: "Applicant's Name", type: 'text', required: true },
        { name: 'plot_number', label: 'Plot/Survey Number', type: 'text', required: true },
        { name: 'address', label: 'Property Address', type: 'textarea', required: true },
        {
            name: 'construction_type',
            label: 'Construction Type',
            type: 'select',
            options: ['Residential', 'Commercial', 'Industrial', 'Mixed Use'],
            required: true,
        },
        { name: 'area_sqft', label: 'Total Area (sq ft)', type: 'number', required: true },
        { name: 'estimated_cost', label: 'Estimated Cost (Rs.)', type: 'number', required: true },
    ],
    business_license: [
        { name: 'business_name', label: 'Business Name', type: 'text', required: true },
        { name: 'owner_name', label: "Owner's Name", type: 'text', required: true },
        { name: 'pan', label: 'Business PAN', type: 'text', required: true },
        { name: 'gst', label: 'GST Number', type: 'text', required: false },
        { name: 'address', label: 'Business Address', type: 'textarea', required: true },
        { name: 'business_category', label: 'Business Category', type: 'text', required: true },
    ],
};

// Chatbot responses
const CHATBOT_RESPONSES = {
    greeting: {
        message: 'Namaste! Welcome to ViksitOS. How can I help you today?',
        options: [
            { label: 'What is ViksitOS?', action: 'what_is_viksitos' },
            { label: 'How to apply for a service?', action: 'how_to_apply' },
            { label: 'Check my applications', action: 'check_applications' },
            { label: 'View my documents', action: 'view_documents' },
        ],
    },
    what_is_viksitos: {
        message:
            'ViksitOS is your one-stop digital platform for all government services. You can apply for certificates, update documents, track applications, and access your digital documents - all in one place!',
        options: [
            { label: 'What services can I apply for?', action: 'available_services' },
            { label: 'How to apply?', action: 'how_to_apply' },
            { label: 'Back to main menu', action: 'greeting' },
        ],
    },
    how_to_apply: {
        message:
            "To apply for a service: 1) Click on 'Apply Services' from the home screen, 2) Browse or search for the service you need, 3) Fill in the required details, 4) Submit your application. You can track the status in 'My Applications'.",
        options: [
            { label: 'What services are available?', action: 'available_services' },
            { label: 'How long does it take?', action: 'processing_time' },
            { label: 'Back to main menu', action: 'greeting' },
        ],
    },
    available_services: {
        message:
            'We offer services under three categories: Certificates (Birth, Death, Marriage, Residence, Income, Caste, etc.), Document Updates (Aadhar, PAN, Voter ID, Passport, Ration Card), and Licenses & Permits (Driving License, Trade License, Building Permit, Business License).',
        options: [
            { label: 'Apply for a service now', action: 'redirect_apply', redirect: 'apply' },
            { label: 'How to apply?', action: 'how_to_apply' },
            { label: 'Back to main menu', action: 'greeting' },
        ],
    },
    check_applications: {
        message:
            "You can check all your submitted applications in the 'My Applications' section. It shows the status (Pending/Approved/Rejected), submission date, and any remarks from the reviewing officer.",
        options: [
            { label: 'Go to My Applications', action: 'redirect_applications', redirect: 'applications' },
            { label: 'What if rejected?', action: 'rejected_info' },
            { label: 'Back to main menu', action: 'greeting' },
        ],
    },
    view_documents: {
        message:
            "Your issued documents are available in the 'Documents' section. This works like DigiLocker - you can view, download, and share your digital certificates and IDs. Updated documents appear here automatically after approval.",
        options: [
            { label: 'Go to Documents', action: 'redirect_documents', redirect: 'documents' },
            { label: 'How are documents issued?', action: 'document_issuance' },
            { label: 'Back to main menu', action: 'greeting' },
        ],
    },
    processing_time: {
        message:
            "Processing times vary by service. Certificates typically take 3-7 working days. Document updates take 5-10 working days. Licenses and permits may take 7-14 working days. You'll receive notifications at each stage.",
        options: [
            { label: 'How to apply?', action: 'how_to_apply' },
            { label: 'Back to main menu', action: 'greeting' },
        ],
    },
    rejected_info: {
        message:
            "If your application is rejected, you'll receive a notification with the reason. You can review the reason in 'My Applications' and reapply with the correct information. There's no limit on reapplications.",
        options: [
            { label: 'Apply again', action: 'redirect_apply', redirect: 'apply' },
            { label: 'Back to main menu', action: 'greeting' },
        ],
    },
    document_issuance: {
        message:
            "Once a government official approves your application, the document is automatically generated and added to your Documents section. You'll receive a notification when this happens.",
        options: [
            { label: 'Go to Documents', action: 'redirect_documents', redirect: 'documents' },
            { label: 'Back to main menu', action: 'greeting' },
        ],
    },
};
