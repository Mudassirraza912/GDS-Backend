import Amadeus from 'amadeus';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Amadeus client
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

/**
 * Flight Service for Amadeus API integration
 */
export class AmadeusFlightService {
  /**
   * Search for available flights
   * @param {string} origin - Origin airport code (e.g., 'SYD')
   * @param {string} destination - Destination airport code (e.g., 'BKK')
   * @param {string} departureDate - Departure date in YYYY-MM-DD format
   * @param {string} returnDate - Return date in YYYY-MM-DD format (optional)
   * @param {number} adults - Number of adult passengers
   * @param {number} children - Number of child passengers
   * @param {string} travelClass - Travel class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)
   * @returns {Promise<Array>} - Flight offers
   */
  async searchFlights(
    origin,
    destination,
    departureDate,
    returnDate = null,
    adults = 1,
    children = 0,
    travelClass = "ECONOMY"
  ) {
    try {
      console.log(
        `Searching flights from ${origin} to ${destination} on ${departureDate}`
      );

      const searchParams = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate,
        adults: adults.toString(),
        currencyCode: "USD",
        max: 20,
      };

      // Add optional parameters if provided
      if (returnDate) searchParams.returnDate = returnDate;
      if (children > 0) searchParams.children = children.toString();
      if (travelClass) searchParams.travelClass = travelClass;

      const response = await amadeus.shopping.flightOffersSearch.get(
        searchParams
      );

      console.log(`Found ${response.data.length} flight offers`);
      return response.data;
    } catch (error) {
      console.error("Error searching flights:", error);
      throw this._formatError(error);
    }
  }

  /**
   * Get pricing for a specific flight offer
   * @param {Object} flightOffer - Flight offer from search results
   * @returns {Promise<Object>} - Priced flight offer
   */
  async getPricing(flightOffer) {
    try {
      console.log("Getting pricing for flight offer");

      const response = await amadeus.shopping.flightOffers.pricing.post(
        JSON.stringify({
          data: {
            type: "flight-offers-pricing",
            flightOffers: [flightOffer],
          },
        })
      );

      console.log("Pricing received successfully");
      return response.data;
    } catch (error) {
      console.error("Error getting flight pricing:", error);
      throw this._formatError(error);
    }
  }

  /**
   * Book a flight
   * @param {Object} flightOffer - Priced flight offer
   * @param {Array} travelers - Array of traveler information
   * @returns {Promise<Object>} - Booking confirmation
   */
  async bookFlight(flightOffer, travelers) {
    try {
      console.log(
        "Creating flight booking",
        JSON.stringify({
          data: {
            type: "flight-order",
            flightOffers: [flightOffer],
            travelers: travelers,
          },
        })
      );
      
      const response = await amadeus.booking.flightOrders.post(
        JSON.stringify({
          data: {
            type: "flight-order",
            flightOffers: [flightOffer],
            travelers: travelers,
          },
        })
      );

      console.log("Flight booked successfully");
      return response.data;
    } catch (error) {
      console.error("Error booking flight:", error);
      throw this._formatError(error);
    }
  }

  /**
   * Get booking details by ID
   * @param {string} bookingId - Booking ID from bookFlight response
   * @returns {Promise<Object>} - Booking details
   */
  async getBooking(bookingId) {
    try {
      console.log(`Retrieving booking with ID: ${bookingId}`);

      // Fetch booking details
      const response = await amadeus.booking.flightOrder(bookingId).get();
      const flightOffers = response?.data?.flightOffers || [];
      const itineraries = flightOffers[0]?.itineraries || [];

      // Get all unique airline codes from all segments
      const airlineCodes = itineraries
        .flatMap((itinerary) =>
          itinerary?.segments?.map((seg) => seg?.carrierCode)
        )
        .filter(Boolean);

      // Get airline info
      const airlinePromises = airlineCodes.map((code) =>
        amadeus.referenceData.airlines.get({ airlineCodes: code })
      );
      const rawResponses = await Promise.all(airlinePromises);
      const airlines = rawResponses
        .map((res) => res?.result?.data?.[0])
        .filter(Boolean);


      // Get seat map
      const seatmaps = await amadeus.shopping.seatmaps.get({
        flightOrderId: bookingId,
      });

      const seatmapData = seatmaps?.result?.data || [];
      const seatmapDictionaries = seatmaps?.result?.dictionaries || {};

      console.log("Booking retrieved successfully");

      return {
        ...response.data,
        airlines,
        seatmaps: seatmapData,
        seatmapLocations: seatmapDictionaries?.locations,
      };
    } catch (error) {
      console.error("Error retrieving booking:", error);
      throw this._formatError(error);
    }
  }

  /**
   * Cancel a booking
   * @param {string} bookingId - Booking ID to cancel
   * @returns {Promise<boolean>} - Success status
   */
  async cancelBooking(bookingId) {
    try {
      console.log(`Cancelling booking with ID: ${bookingId}`);

      await amadeus.booking.flightOrder(bookingId).delete();

      console.log("Booking cancelled successfully");
      return true;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw this._formatError(error);
    }
  }

  /**
   * Format error response
   * @private
   * @param {Error} error - Error object
   * @returns {Error} - Formatted error
   */
  _formatError(error) {
    if (error.response && error.response.data && error.response.data.errors) {
      const amadeusError = error.response.data.errors[0];
      const formattedError = new Error(
        amadeusError.detail || amadeusError.title
      );
      formattedError.code = amadeusError.code;
      formattedError.status = amadeusError.status;
      return formattedError;
    }
    return error;
  }
}