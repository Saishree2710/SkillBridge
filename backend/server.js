const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars FIRST before routes
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const providerRoutes = require('./routes/providerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

const customerRoutes = require('./routes/customerRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/public/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);


app.get('/', (req, res) => {
  res.send('SkillBridge API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
