const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const User = require('./models/User');

const app = express();
const port = 3000;

// Override via environment in production — the fallback is for local development only
const JWT_SECRET = process.env.JWT_SECRET || 'anglers-secret-dev-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/anglersSecret';

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/api/weather/current', async (req, res) => {
  const location = req.query.location;
  try {
    const response = await axios.get(`http://api.weatherapi.com/v1/current.json?key=45b8474fde374c41ac3134812232811&q=${location}&aqi=no`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'An error occurred' });
  }
});

app.get('/api/weather/historical', async (req, res) => {
    const location = req.query.location;
    const date = req.query.date;
    try {
        const response = await axios.get(`http://api.weatherapi.com/v1/history.json?key=45b8474fde374c41ac3134812232811&q=${location}&dt=${date}`)
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'An error occurred' });
    }
});

function createToken(user) {
  return jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function toPublicUser(user) {
  return { id: user._id, username: user.username, email: user.email };
}

// Verifies the Bearer token and attaches the user to the request
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
}

// SIGNUP route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({ message: `An account with that ${field} already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ token: createToken(newUser), user: toPublicUser(newUser) });
  } catch (error) {
    // Duplicate key — another request created the same email/username first
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with those details already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid signup details' });
    }
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

// LOGIN route
app.post('/api/auth/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: createToken(user), user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

// Returns the logged-in user for a valid token, used to restore sessions on app load
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
