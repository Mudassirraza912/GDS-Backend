import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flightDetails: {
    pnr: String,
    gdsBookingReference: String,
    origin: String,
    destination: String,
    departureDate: Date,
    returnDate: Date,
    passengers: [{
      firstName: String,
      lastName: String,
      email: String,
      phone: String
    }],
    price: {
      amount: Number,
      currency: String
    }
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'confirmed'
  },
  rawResponse: Object,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ 'flightDetails.departureDate': 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;