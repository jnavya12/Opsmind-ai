require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const ingestRoutes = require('./routes/ingestRoutes');
const queryRoutes = require('./routes/queryRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Connect to Database
if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'your_mongodb_connection_string') {
    connectDB();
} else {
    console.log("MongoDB URI not set or is default, skipping DB connection");
}

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('OpsMind AI API is running...');
});

// Routes
console.log("Mounting Routes...");

app.use((req, res, next) => {
    console.log(`\n--- INCOMING REQUEST ---`);
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

app.use('/api', queryRoutes);
app.use('/api', ingestRoutes);
app.use('/api', chatRoutes);

// Health Check
app.get('/api/health', (req, res) => res.send('API OK'));

// Force port 5000 to match client
const PORT = 5000;

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
