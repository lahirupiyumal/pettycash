const router = require('express').Router();
const auth = require('../middleware/auth');
const { 
  importAccountants, 
  googleDriveSync,
  getAccountants, 
  getImportedFiles, 
  deleteAccountants 
} = require('../controllers/accountantController');

router.post('/import', auth, importAccountants);
router.post('/google-drive-sync', auth, googleDriveSync);
router.get('/files', auth, getImportedFiles);
router.get('/', auth, getAccountants);
router.delete('/', auth, deleteAccountants);

module.exports = router;
