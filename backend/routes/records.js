const router = require('express').Router();
const auth = require('../middleware/auth');
const { importRecords, getRecords, deleteRecords } = require('../controllers/recordController');

router.post('/import', auth, importRecords);
router.get('/', auth, getRecords);
router.delete('/', auth, deleteRecords);

module.exports = router;
