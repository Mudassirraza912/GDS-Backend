import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import flightRoutes from './routes/flight-routes.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const allowedOrigins = [
  'http://localhost:3000', // Local development
  'https://mudassirs-gds-mvp-frontend.vercel.app' // Production
];
// Middleware
// Configure CORS for your React app
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.options('*', cors());

// Session: store in MongoDB
app.use(session({
  secret: process.env.SESSION_SECRECT, // set a strong secret in .env
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true on Vercel
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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