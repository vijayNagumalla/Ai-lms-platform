const mysql = require('mysql2/promise');

async function runDefaultDepartmentsMigration() {
  let pool;
  try {
    // Direct database connection
    const dbConfig = {
      host: 'localhost',
      user: 'root',
      password: '', // Add your MySQL password here if you have one
      database: 'lms_platform', // Ensure this matches your actual DB name
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    
    pool = mysql.createPool(dbConfig);
    console.log('Connected to database successfully');

    // Check if college-001 exists, if not create it
    const [colleges] = await pool.execute(
      'SELECT id FROM colleges WHERE id = ?',
      ['college-001']
    );

    if (colleges.length === 0) {
      console.log('Creating college-001 for default departments...');
      await pool.execute(`
        INSERT INTO colleges (
          id, name, code, email, phone, address, city, state, country, 
          established_year, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'college-001',
        'System Default College',
        'SYS-DEF',
        'system@default.com',
        '0000000000',
        'System Address',
        'System City',
        'System State',
        'System Country',
        2024,
        true
      ]);
      console.log('Created college-001 successfully');
    }

    // Insert default departments
    console.log('Inserting default departments...');
    
    const defaultDepartments = [
      ['Computer Science', 'CS', 'Computer Science and Engineering Department'],
      ['Electrical Engineering', 'EE', 'Electrical and Electronics Engineering Department'],
      ['Mechanical Engineering', 'ME', 'Mechanical Engineering Department'],
      ['Civil Engineering', 'CE', 'Civil Engineering Department'],
      ['Information Technology', 'IT', 'Information Technology Department'],
      ['Electronics & Communication', 'ECE', 'Electronics and Communication Engineering Department'],
      ['Chemical Engineering', 'CHE', 'Chemical Engineering Department'],
      ['Biotechnology', 'BT', 'Biotechnology Department'],
      ['Business Administration', 'BA', 'Business Administration and Management Department'],
      ['Commerce', 'COM', 'Commerce and Accounting Department'],
      ['Economics', 'ECO', 'Economics Department'],
      ['Mathematics', 'MATH', 'Mathematics Department'],
      ['Physics', 'PHY', 'Physics Department'],
      ['Chemistry', 'CHEM', 'Chemistry Department'],
      ['English', 'ENG', 'English Language and Literature Department'],
      ['History', 'HIST', 'History Department'],
      ['Psychology', 'PSY', 'Psychology Department'],
      ['Sociology', 'SOC', 'Sociology Department'],
      ['Political Science', 'POL', 'Political Science Department'],
      ['Geography', 'GEO', 'Geography Department'],
      ['Philosophy', 'PHIL', 'Philosophy Department']
    ];

    for (const [name, code, description] of defaultDepartments) {
      try {
        await pool.execute(`
          INSERT INTO college_departments (
            id, college_id, name, code, description, is_active, created_at, updated_at
          ) VALUES (UUID(), ?, ?, ?, ?, TRUE, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          updated_at = NOW()
        `, ['college-001', name, code, description]);
        console.log(`✓ Added/Updated: ${name} (${code})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`✓ Already exists: ${name} (${code})`);
        } else {
          console.error(`✗ Error with ${name}:`, error.message);
        }
      }
    }

    console.log('\nDefault departments migration completed successfully!');
    
    // Show what was added
    const [departments] = await pool.execute(`
      SELECT name, code, description 
      FROM college_departments 
      WHERE college_id = 'college-001' AND is_active = TRUE
      ORDER BY name ASC
    `);
    
    console.log(`\nTotal default departments available: ${departments.length}`);
    departments.forEach(dept => {
      console.log(`  - ${dept.name} (${dept.code})`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (pool) {
      await pool.end();
      console.log('Database connection closed');
    }
  }
}

runDefaultDepartmentsMigration();
