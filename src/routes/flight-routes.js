
import express from 'express';
import { AmadeusFlightService } from '../amadeus-flight-service.js';
import { authenticateJWT } from '../middleware/auth-middleware.js';
import FlightOffer from '../models/flight-offer-model.js';
import PricedOffer from '../models/priced-offer-model.js';
import Booking from '../models/booking-model.js';

const router = express.Router();
const flightService = new AmadeusFlightService();

// Search flights (protected)
router.get('/search', authenticateJWT, async (req, res) => {
  try {
    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate, 
      adults = 1, 
      children = 0, 
      travelClass = 'ECONOMY' 
    } = req.query;
    
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const flights = await flightService.searchFlights(
      origin, 
      destination, 
      departureDate, 
      returnDate, 
      parseInt(adults), 
      parseInt(children), 
      travelClass
    );
    // Save offers to DB for this user
    await FlightOffer.findOneAndUpdate(
      { userId: req.user.userId },
      { offers: flights, createdAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(flights);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Get pricing for a flight offer (protected)
router.post('/price', authenticateJWT, async (req, res) => {
  try {
    const { flightOfferId } = req.body;
    
    if (!flightOfferId) {
      return res.status(400).json({ error: 'Flight offer ID is required' });
    }
    
    // Retrieve flight offers from DB
    const flightOffersDoc = await FlightOffer.findOne({ userId: req.user.userId });
    if (!flightOffersDoc || !flightOffersDoc.offers) {
      return res.status(400).json({ error: 'No flight offers found. Please search again.' });
    }
    // Find the selected flight offer
    const selectedOffer = flightOffersDoc.offers.find(offer => offer.id === flightOfferId);
    if (!selectedOffer) {
      return res.status(404).json({ error: 'Flight offer not found' });
    }
    const pricedOffer = await flightService.getPricing(selectedOffer);
    // Store priced offer in DB
    await PricedOffer.findOneAndUpdate(
      { userId: req.user.userId },
      { offer: pricedOffer, createdAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(pricedOffer);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Book a flight (protected)
router.post('/book', authenticateJWT, async (req, res) => {
  try {
    const { travelers } = req.body;
    
    if (!travelers || !Array.isArray(travelers) || travelers.length === 0) {
      return res.status(400).json({ error: 'Traveler information is required' });
    }
    
    // Retrieve priced offer from DB
    const pricedOfferDoc = await PricedOffer.findOne({ userId: req.user.userId });
    if (!pricedOfferDoc || !pricedOfferDoc.offer) {
      return res.status(400).json({ error: 'No priced offer found. Please search and price again.' });
    }
    // Book the flight
    const booking = await flightService.bookFlight(pricedOfferDoc.offer.flightOffers[0], travelers);
    // Save booking to database
    const newBooking = new Booking({
      userId: req.user.userId,
      bookingId: booking.id || booking.bookingId || booking.pnr || booking.gdsBookingReference || (Date.now() + ''),
      flightDetails: booking.flightDetails || {},
      status: booking.status || 'confirmed',
      rawResponse: booking,
    });
    await newBooking.save();
    res.json(booking);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Get booking details (protected)
router.get('/booking/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    
    // Only allow user to access their own booking
    const booking = await Booking.findOne({ bookingId: id, userId: req.user.userId });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Cancel booking (protected)
router.delete('/booking/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    
    // Only allow user to cancel their own booking
    const booking = await Booking.findOne({ bookingId: id, userId: req.user.userId });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    await flightService.cancelBooking(id);
    booking.status = 'cancelled';
    await booking.save();
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;