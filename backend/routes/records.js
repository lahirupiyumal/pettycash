const router = require('express').Router();
const auth = require('../middleware/auth');
const { importRecords, getRecords, getImportedFiles, deleteRecords } = require('../controllers/recordController');

router.post('/import', auth, importRecords);
router.get('/files', auth, getImportedFiles);
router.get('/', auth, getRecords);
router.delete('/', auth, deleteRecords);

module.exports = router;
