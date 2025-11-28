import express from 'express';
import { createCheckoutSession, getUserOrders, checkoutSimple } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/checkout', protect, checkoutSimple);
router.get('/', protect, getUserOrders);

export default router;  