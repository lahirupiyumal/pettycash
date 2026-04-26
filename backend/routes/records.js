const router = require('express').Router();
const auth = require('../middleware/auth');
const { importRecords, getRecords } = require('../controllers/recordController');

router.post('/import', auth, importRecords);
router.get('/', auth, getRecords);

module.exports = router;
