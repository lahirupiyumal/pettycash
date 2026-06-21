const router = require('express').Router();
const { auth, admin } = require('../middleware/auth');
const { importRecords, googleDriveSync, getRecords, getImportedFiles, deleteRecords } = require('../controllers/recordController');

router.post('/import', auth, admin, importRecords);
router.post('/google-drive-sync', auth, admin, googleDriveSync);
router.get('/files', auth, admin, getImportedFiles);
router.get('/', auth, getRecords);
router.delete('/', auth, admin, deleteRecords);

module.exports = router;
