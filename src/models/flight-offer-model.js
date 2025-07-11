import mongoose from 'mongoose';

const flightOfferSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offers: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 } // 1 day TTL
});

const FlightOffer = mongoose.model('FlightOffer', flightOfferSchema);

export default FlightOffer;
