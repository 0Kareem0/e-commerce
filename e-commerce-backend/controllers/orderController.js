// controllers/orderController.js
import Order from '../models/Order.js';
import Stripe from 'stripe';

// DO NOT create stripe instance at the top!

// controllers/orderController.js
export const createCheckoutSession = async (req, res) => {
  const { items, total } = req.body;

  console.log("Checkout Request:", { itemsCount: items?.length, total, user: req.user?._id });

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  try {
    const rawKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!rawKey) {
      console.error("Missing STRIPE_SECRET_KEY in environment");
      return res.status(500).json({ message: "Stripe is not configured. Set STRIPE_SECRET_KEY in backend .env and restart the server." });
    }
    if (!rawKey.startsWith('sk_test_') && !rawKey.startsWith('sk_live_')) {
      console.error("Invalid STRIPE_SECRET_KEY format");
      return res.status(500).json({ message: "Invalid Stripe secret key format. Ensure it starts with sk_test_ (for test) or sk_live_." });
    }
    const stripe = new Stripe(rawKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout-success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/cart`,
      metadata: { userId: req.user?._id?.toString() || 'unknown' },
    });

    // SAVE ORDER TO MONGODB
    const order = new Order({
      user: req.user._id,
      items: items.map(i => ({
        product: i._id,           // ← MUST BE i._id
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image || null,
      })),
      total: parseFloat(total),
      stripePaymentId: session.id, // ← Save session ID
      status: 'pending',
    });

    await order.save(); // ← This MUST run
    console.log("Order saved to DB:", order._id);

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout failed:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Simple internal checkout without Stripe
export const checkoutSimple = async (req, res) => {
  const { items, total, shipping, paymentMethod, paymentStatus } = req.body;
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized. Please login to checkout.' });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }
  try {
    const order = new Order({
      user: req.user._id,
      items: items.map(i => ({
        product: i._id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image || null,
      })),
      total: parseFloat(total),
      status: 'accepted',
      shipping: shipping || {},
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentStatus || 'paid',
    });
    await order.save();
    res.status(201).json({ success: true, orderId: order._id, status: order.status });
  } catch (err) {
    console.error('Simple checkout failed:', err.message);
    res.status(500).json({ message: err.message });
  }
};