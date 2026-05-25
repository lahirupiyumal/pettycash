const router = require('express').Router();
const { register, login, microsoftLogin, microsoftCallback, getUsers, updateStatus, deleteUser } = require('../controllers/authController');
const { auth, admin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/microsoft', microsoftLogin);
router.get('/microsoft/callback', microsoftCallback);
router.get('/', auth, admin, getUsers);
router.patch('/status', auth, admin, updateStatus);
router.delete('/:id', auth, admin, deleteUser);

module.exports = router;
