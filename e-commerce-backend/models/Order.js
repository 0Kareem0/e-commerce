import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  total: { type: Number, required: true },
  status: { type: String, default: 'pending' }, // e.g., pending, accepted, shipped
  // Simulated payment + shipping details
  paymentMethod: { type: String, default: 'cod' }, // cod, card (simulated)
  paymentStatus: { type: String, default: 'paid' }, // paid, pending
  shipping: {
    fullName: String,
    address: String,
    city: String,
    country: String,
    phone: String,
    notes: String,
  },
  stripePaymentId: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Order', orderSchema);