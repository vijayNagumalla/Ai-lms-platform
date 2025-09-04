# Department Management Features

## Overview
The College Management System now includes enhanced department management capabilities with auto-generation of department codes and default department options.

## Features

### 1. Auto-Generated Department Codes
- **Automatic Generation**: Department codes are automatically generated when you enter a department name
- **Smart Algorithm**: The system uses intelligent logic to create meaningful codes:
  - Single word: First 2-3 characters (e.g., "Computer Science" → "COM")
  - Two words: First letter of each word (e.g., "Electrical Engineering" → "EE")
  - Multiple words: First letter of first two words + first letter of last word (e.g., "Information Technology" → "IT")
- **Manual Override**: You can still manually edit the generated code if needed
- **Real-time Preview**: See what the code will be as you type the department name

### 2. Default Department Options
The system provides 21 pre-defined departments commonly used across colleges:

#### Engineering Departments
- Computer Science (CS)
- Electrical Engineering (EE)
- Mechanical Engineering (ME)
- Civil Engineering (CE)
- Information Technology (IT)
- Electronics & Communication (ECE)
- Chemical Engineering (CHE)
- Biotechnology (BT)

#### Business & Commerce
- Business Administration (BA)
- Commerce (COM)
- Economics (ECO)

#### Sciences
- Mathematics (MATH)
- Physics (PHY)
- Chemistry (CHEM)

#### Arts & Humanities
- English (ENG)
- History (HIST)
- Psychology (PSY)
- Sociology (SOC)
- Political Science (POL)
- Geography (GEO)
- Philosophy (PHIL)

### 3. Enhanced Validation
- **Unique Names**: Department names must be unique within the college
- **Unique Codes**: Department codes must be unique within the college
- **Cross-Validation**: Checks for conflicts between custom departments and selected default departments
- **Required Fields**: Name and code are mandatory for all departments

### 4. User Experience Improvements
- **Inline Forms**: Custom departments are now added inline within the main form
- **Visual Indicators**: Clear labeling shows which fields are auto-generated
- **Helpful Text**: Explanatory text guides users through the process
- **Real-time Feedback**: Immediate validation and code generation

## How to Use

### Adding Default Departments
1. In the "Default Department Options" section, click on any department button
2. The department will be added to your "Selected Default Departments" list
3. You can remove departments by clicking the trash icon

### Creating Custom Departments
1. Click "Custom Department" button to add a new custom department form
2. Enter the department name - the code will be automatically generated
3. Optionally modify the generated code if needed
4. Add a description (optional)
5. Add more custom departments as needed

### Code Generation Examples
- "Computer Science" → "COM"
- "Electrical Engineering" → "EE"
- "Information Technology" → "IT"
- "Business Administration" → "BA"
- "Mechanical Engineering" → "ME"

## Technical Implementation

### Frontend Changes
- Enhanced `CollegeManagementPage.jsx` with auto-generation logic
- Improved validation for duplicate names and codes
- Real-time code preview functionality
- Better UI/UX with inline forms and helpful text

### Backend Changes
- Default departments stored in `college_departments` table
- Migration script to populate default departments
- Enhanced validation in the college creation process

### Database Schema
- `college_departments` table stores both default and custom departments
- Unique constraints on college_id + code combination
- Proper foreign key relationships with colleges table

## Migration
To set up default departments, run:
```bash
cd backend
node run-default-departments-migration.cjs
```

This will:
1. Create a system default college if it doesn't exist
2. Insert all 21 default departments
3. Handle duplicate entries gracefully
4. Provide feedback on the migration process

## Benefits
- **Faster Setup**: Colleges can quickly select from common departments
- **Consistency**: Standardized department codes across the system
- **Flexibility**: Custom departments for unique requirements
- **User-Friendly**: Intuitive interface with helpful guidance
- **Data Quality**: Built-in validation prevents duplicate entries
