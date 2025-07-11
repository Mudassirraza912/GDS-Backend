import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import flightRoutes from './routes/flight-routes.js';
import session from 'express-session';
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Configure CORS for your React app
app.use(cors({
  origin: 'https://mudassirs-gds-mvp-frontend.vercel.app',
  credentials: true,
}));
app.options('*', cors());

// Set up session middleware BEFORE your routes
app.use(session({
  secret: process.env.SESSION_SECRECT, // Replace with a real secret key
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/flights', flightRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('GDS Flight Booking API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});