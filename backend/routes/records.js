const router = require('express').Router();
const auth = require('../middleware/auth');
const { importRecords, googleDriveSync, getRecords, getImportedFiles, deleteRecords } = require('../controllers/recordController');

router.post('/import', auth, importRecords);
router.post('/google-drive-sync', auth, googleDriveSync);
router.get('/files', auth, getImportedFiles);
router.get('/', auth, getRecords);
router.delete('/', auth, deleteRecords);

module.exports = router;
