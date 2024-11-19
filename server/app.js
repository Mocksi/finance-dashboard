const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
// ... other imports

const app = express();

app.use(cors());
app.use(express.json());

// Update the API routes
app.use('/api/users', userRoutes);  // Changed from /api/account to /api/users

// ... rest of the server setup 