const User = require('../models/User');
const recordController = require('../controllers/recordController');
const accountantController = require('../controllers/accountantController');
const { createAuditLog } = require('../middleware/audit');

const startAutoSync = () => {
  console.log('Auto Sync Scheduler initialized: Syncing every 30 minutes.');

  const runSync = async () => {
    console.log('Starting scheduled background Google Drive sync...');
    try {
      // Find all active/approved users
      const users = await User.find({ isApproved: true }).select('name email role').lean();
      
      for (const user of users) {
        console.log(`Running background sync for user: ${user.email}`);
        
        // 1. Sync Petty Cash records
        try {
          const pettyCashResult = await recordController.syncPettyCashForUser(user._id);
          if (pettyCashResult.count > 0) {
            console.log(`Background Sync: Successfully synced ${pettyCashResult.count} petty cash record(s) for ${user.email}.`);
            await createAuditLog(
              user,
              'Auto Sync Petty Cash from Google Drive',
              'import',
              `Successfully auto-synchronized ${pettyCashResult.count} record(s) from Google Drive.`,
              { fileName: 'PettyCash.xlsx', syncSource: 'Google Drive Auto Sync', importedCount: pettyCashResult.count, skippedCount: pettyCashResult.skipped }
            );
          }
        } catch (err) {
          console.error(`Error syncing petty cash for user ${user.email}:`, err.message);
        }

        // 2. Sync Accountant records
        try {
          const accountantResult = await accountantController.syncAccountantsForUser(user._id);
          if (accountantResult.count > 0) {
            console.log(`Background Sync: Successfully synced ${accountantResult.count} accountant record(s) for ${user.email}.`);
            await createAuditLog(
              user,
              'Auto Sync Accountant Data from Google Drive',
              'import',
              `Successfully auto-synchronized ${accountantResult.count} accountant record(s) from Google Drive.`,
              { fileName: 'Accountant.xlsx', syncSource: 'Google Drive Auto Sync', importedCount: accountantResult.count, skippedCount: accountantResult.skipped }
            );
          }
        } catch (err) {
          console.error(`Error syncing accountants for user ${user.email}:`, err.message);
        }
      }
      console.log('Background Google Drive sync completed.');
    } catch (err) {
      console.error('Error in scheduled background sync:', err);
    }
  };

  // Run 10 seconds after server start to not block startup
  setTimeout(runSync, 10000);

  // Run every 30 minutes
  setInterval(runSync, 30 * 60 * 1000);
};

module.exports = { startAutoSync };
