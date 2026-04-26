const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAll, create, update, remove, getSummary } = require('../controllers/transactionController');

router.get('/', auth, getAll);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);
router.get('/summary', auth, getSummary);

module.exports = router;
