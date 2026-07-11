import { Router } from 'express';
import { registerUser, loginUser, logoutUser, getCurrentUser, refreshAccessToken } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Below line of code means that when a POST request is made to "/register", the registerUser controller function will be called.
// Unsecure Routes
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/refresh-token').get(refreshAccessToken);


// Secure Routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/current-user').get(verifyJWT, getCurrentUser);

export default router;