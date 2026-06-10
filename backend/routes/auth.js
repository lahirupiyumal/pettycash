const router = require('express').Router();
const { register, login, getUsers, updateStatus, deleteUser } = require('../controllers/authController');
const { microsoftLogin, microsoftCallback, microsoftFinish } = require('../controllers/microsoftAuthController');
const { auth, admin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/microsoft', microsoftLogin);
router.get('/microsoft/callback', microsoftCallback);
router.post('/microsoft/finish', microsoftFinish);
router.get('/', auth, admin, getUsers);
router.patch('/status', auth, admin, updateStatus);
router.delete('/:id', auth, admin, deleteUser);

module.exports = router;
