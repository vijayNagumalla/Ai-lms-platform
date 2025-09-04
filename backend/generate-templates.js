import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Student template data with admission type field
const studentTemplateData = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91-9876543210',
    student_id: 'CS2024001',
    admission_type: 'regular',
    batch: '2024',
    joining_year: '2024',
    ending_year: '2028'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+91-9876543211',
    student_id: 'CS2024002',
    admission_type: 'lateral',
    batch: '2024',
    joining_year: '2024',
    ending_year: '2028'
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    phone: '+91-9876543212',
    student_id: 'CS2024003',
    admission_type: 'regular',
    batch: '2024',
    joining_year: '2024',
    ending_year: '2028'
  }
];

// Faculty template data
const facultyTemplateData = [
  {
    name: 'Dr. Robert Johnson',
    email: 'robert.johnson@example.com',
    role: 'faculty',
    college_code: 'COLLEGE001',
    department: 'Computer Science',
    phone: '+91-9876543212',
    status: 'active'
  },
  {
    name: 'Prof. Sarah Wilson',
    email: 'sarah.wilson@example.com',
    role: 'faculty',
    college_code: 'COLLEGE001',
    department: 'Computer Science',
    phone: '+91-9876543213',
    status: 'active'
  }
];

// College Admin template data
const collegeAdminTemplateData = [
  {
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    role: 'college-admin',
    college_code: 'COLLEGE001',
    phone: '+91-9876543214',
    status: 'active'
  }
];

function generateStudentTemplate() {
  const workbook = xlsx.utils.book_new();
  
  // Create the main data worksheet
  const worksheet = xlsx.utils.json_to_sheet(studentTemplateData);
  
  // Set column widths for student template
  const colWidths = [
    { wch: 25 }, // name
    { wch: 35 }, // email
    { wch: 20 }, // phone
    { wch: 20 }, // student_id
    { wch: 18 }, // admission_type
    { wch: 15 }, // batch
    { wch: 18 }, // joining_year
    { wch: 18 }  // ending_year
  ];
  
  worksheet['!cols'] = colWidths;
  
  // Add headers with better formatting
  const headers = [
    'Name *',
    'Email ID *', 
    'Phone Number',
    'Roll Number *',
    'Admission Type',
    'Batch',
    'Joining Year',
    'Ending Year'
  ];
  
  // Insert headers at the top
  xlsx.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });
  
  // Create a instructions worksheet
  const instructionsData = [
    ['STUDENT UPLOAD TEMPLATE - INSTRUCTIONS'],
    [''],
    ['REQUIRED FIELDS (marked with *):'],
    ['• Name: Full name of the student'],
    ['• Email ID: Unique email address (must be unique in system)'],
    ['• Roll Number: Student roll number (will be stored in CAPS)'],
    [''],
    ['OPTIONAL FIELDS:'],
    ['• Phone Number: Contact number'],
    ['• Admission Type: "regular" or "lateral" (defaults to "regular")'],
    ['• Batch: Student batch or class group'],
    ['• Joining Year: Academic year when student joined'],
    ['• Ending Year: Expected completion year'],
    [''],
    ['ADMISSION TYPE GUIDE:'],
    ['• Regular: Standard 4-year program entry'],
    ['• Lateral: Advanced entry (typically 2nd year) - System automatically adds +1 year to calculations'],
    [''],
    ['IMPORTANT NOTES:'],
    ['• College and Department will be automatically filled based on your selection above'],
    ['• Roll numbers are automatically converted to CAPS when stored'],
    ['• For lateral students, years are automatically adjusted (+1 year)'],
    ['• If joining/ending years are not specified, system uses current year + 4 years'],
    [''],
    ['SAMPLE DATA:'],
    ['• Regular student: admission_type = "regular"'],
    ['• Lateral student: admission_type = "lateral"'],
    ['• Years can be specified as numbers (e.g., 2024, 2028)'],
    ['• Status defaults to "active" for all students']
  ];
  
  const instructionsSheet = xlsx.utils.aoa_to_sheet(instructionsData);
  
  // Set column widths for instructions
  instructionsSheet['!cols'] = [{ wch: 80 }];
  
  // Add both sheets to workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Student Data');
  xlsx.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  
  const outputPath = path.join(__dirname, 'database', 'student_upload_template.xlsx');
  xlsx.writeFile(workbook, outputPath);
  
  console.log('Generated enhanced student_upload_template.xlsx successfully');
}

function generateTemplate(type, data, filename) {
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(data);
  
  // Set column widths
  const colWidths = [
    { wch: 20 }, // name
    { wch: 30 }, // email
    { wch: 15 }, // role
    { wch: 15 }, // college_code
    { wch: 20 }, // department
    { wch: 15 }, // student_id
    { wch: 15 }, // joining_year
    { wch: 15 }, // final_year
    { wch: 20 }, // phone
    { wch: 15 }  // status
  ];
  
  worksheet['!cols'] = colWidths;
  
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');
  
  const outputPath = path.join(__dirname, 'database', filename);
  xlsx.writeFile(workbook, outputPath);
  
  console.log(`Generated ${filename} successfully`);
}

// Generate all templates
console.log('Generating Excel templates...');

// Enhanced Student template with admission type
generateStudentTemplate();

// Faculty template
generateTemplate('faculty', facultyTemplateData, 'faculty_upload_template.xlsx');

// College Admin template
generateTemplate('college-admin', collegeAdminTemplateData, 'college-admin_upload_template.xlsx');

console.log('All templates generated successfully!');
console.log('\nTemplate files created:');
console.log('- student_upload_template.xlsx (Enhanced with admission type)');
console.log('- faculty_upload_template.xlsx');
console.log('- college-admin_upload_template.xlsx');
console.log('\nStudent Template Features:');
console.log('✅ Admission Type field (regular/lateral)');
console.log('✅ Enhanced instructions worksheet');
console.log('✅ Better sample data with examples');
console.log('✅ Automatic year calculations for lateral students');
console.log('✅ Clear field descriptions and requirements');

