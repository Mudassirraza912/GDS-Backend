import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import flightRoutes from './routes/flight-routes.js';
import authRoutes from './routes/auth-routes.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const allowedOrigins = [
  'http://localhost:3000', 
  'https://mudassirs-gds-mvp-frontend.vercel.app' 
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.options('*', cors());

// Session: store in MongoDB
app.use(session({
  secret: process.env.SESSION_SECRECT, 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, 
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, 
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Auth routes
app.use('/api/auth', authRoutes);

app.use('/api/flights', flightRoutes);

app.get('/', (req, res) => {
  res.send('GDS Flight Booking API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});