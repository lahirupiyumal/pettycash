const router = require('express').Router();
const { auth, admin } = require('../middleware/auth');
const { 
  importAccountants, 
  googleDriveSync,
  getAccountants, 
  getImportedFiles, 
  deleteAccountants 
} = require('../controllers/accountantController');

router.post('/import', auth, admin, importAccountants);
router.post('/google-drive-sync', auth, admin, googleDriveSync);
router.get('/files', auth, admin, getImportedFiles);
router.get('/', auth, getAccountants);
router.delete('/', auth, admin, deleteAccountants);

module.exports = router;
