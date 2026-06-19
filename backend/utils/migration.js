const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const runMigration = async () => {
  console.log('Running role refactoring database migration...');
  try {
    // 1. Update existing Users with 'user' role to 'department lead'
    const userResult = await User.updateMany(
      { role: 'user' },
      { $set: { role: 'department lead' } }
    );
    if (userResult.modifiedCount > 0) {
      console.log(`Migration: Successfully converted ${userResult.modifiedCount} User roles to 'department lead'.`);
    } else {
      console.log('Migration: No users with role "user" found.');
    }

    // 2. Update existing Audit Logs with 'user' role to 'department lead'
    const auditResult = await AuditLog.updateMany(
      { userRole: 'user' },
      { $set: { userRole: 'department lead' } }
    );
    if (auditResult.modifiedCount > 0) {
      console.log(`Migration: Successfully updated ${auditResult.modifiedCount} AuditLog userRole fields to 'department lead'.`);
    } else {
      console.log('Migration: No audit logs with userRole "user" found.');
    }
    
    console.log('Role refactoring migration completed successfully.');
  } catch (err) {
    console.error('Migration Error:', err);
  }
};

module.exports = { runMigration };
