import Amadeus from 'amadeus';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Amadeus client
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

// Search for flights
export const searchFlights = async (originCode, destinationCode, departureDate, returnDate, adults = 1) => {
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate,
      returnDate,
      adults,
      currencyCode: 'USD',
      max: 20
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching flights:', error);
    throw error;
  }
};

// Get flight price
export const getFlightPrice = async (flightOffers) => {
  try {
    const response = await amadeus.shopping.flightOffers.pricing.post(
      JSON.stringify({
        data: {
          type: 'flight-offers-pricing',
          flightOffers: [flightOffers]
        }
      })
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting flight price:', error);
    throw error;
  }
};

// Book a flight
export const bookFlight = async (flightOffer, travelers) => {
  try {
    const response = await amadeus.booking.flightOrders.post(
      JSON.stringify({
        data: {
          type: 'flight-order',
          flightOffers: [flightOffer],
          travelers
        }
      })
    );
    
    return response.data;
  } catch (error) {
    console.error('Error booking flight:', error);
    throw error;
  }
};