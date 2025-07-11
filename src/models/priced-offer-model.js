import mongoose from 'mongoose';

const pricedOfferSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offer: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 } // 1 day TTL
});

const PricedOffer = mongoose.model('PricedOffer', pricedOfferSchema);

export default PricedOffer;
