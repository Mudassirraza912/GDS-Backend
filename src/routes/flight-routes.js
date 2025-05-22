import express from 'express';
import { AmadeusFlightService } from '../amadeus-flight-service.js';

const router = express.Router();
const flightService = new AmadeusFlightService();

// Search flights
router.get('/search', async (req, res) => {
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
    
    // Store flight offers in session or cache for later use
    req.session.flightOffers = flights;
    
    res.json(flights);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Get pricing for a flight offer
router.post('/price', async (req, res) => {
  try {
    const { flightOfferId } = req.body;
    
    if (!flightOfferId) {
      return res.status(400).json({ error: 'Flight offer ID is required' });
    }
    
    // Retrieve flight offers from session or cache
    const flightOffers = req.session.flightOffers;
    if (!flightOffers) {
      return res.status(400).json({ error: 'No flight offers found. Please search again.' });
    }
    
    // Find the selected flight offer
    const selectedOffer = flightOffers.find(offer => offer.id === flightOfferId);
    if (!selectedOffer) {
      return res.status(404).json({ error: 'Flight offer not found' });
    }
    
    const pricedOffer = await flightService.getPricing(selectedOffer);
    
    // Store priced offer in session or cache
    req.session.pricedOffer = pricedOffer;
    
    res.json(pricedOffer);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Book a flight
router.post('/book', async (req, res) => {
  try {
    const { travelers } = req.body;
    
    if (!travelers || !Array.isArray(travelers) || travelers.length === 0) {
      return res.status(400).json({ error: 'Traveler information is required' });
    }
    
    // Retrieve priced offer from session or cache
    const pricedOffer = req.session.pricedOffer;
    if (!pricedOffer) {
      return res.status(400).json({ error: 'No priced offer found. Please search and price again.' });
    }
    
    // Book the flight
    const booking = await flightService.bookFlight(pricedOffer.flightOffers[0], travelers);
    
    // Save booking to database
    // This is where you would store the booking in your MongoDB
    
    res.json(booking);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Get booking details
router.get('/booking/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    
    const booking = await flightService.getBooking(id);
    res.json(booking);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Cancel booking
router.delete('/booking/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    
    await flightService.cancelBooking(id);
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;