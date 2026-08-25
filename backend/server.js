const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const User = require('./models/User');

const app = express();

app.use(helmet());
app.use(cors());
// Bodies here are small JSON payloads; a low cap blunts trivial memory-exhaustion attempts
app.use(bodyParser.json({ limit: '10kb' }));

// Brute-force protection on credential checks. Counts only failed attempts so a
// legitimate user working normally is never locked out by their own success.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
});

// Signups are rarer than logins, so this is capped per IP over a longer window
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many accounts created from this address. Please try again later.' },
});

mongoose.connect(config.mongoUri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Guards the weather routes so a missing key fails clearly rather than as a 500 from upstream
function requireWeatherKey(req, res, next) {
  if (!config.weatherApiKey) {
    return res.status(503).json({ message: 'Weather service is not configured' });
  }
  next();
}

app.get('/api/weather/current', requireWeatherKey, async (req, res) => {
  try {
    const response = await axios.get('https://api.weatherapi.com/v1/current.json', {
      params: { key: config.weatherApiKey, q: req.query.location, aqi: 'no' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Current weather lookup failed:', error.message);
    res.status(500).json({ message: 'An error occurred' });
  }
});

app.get('/api/weather/historical', requireWeatherKey, async (req, res) => {
  try {
    const response = await axios.get('https://api.weatherapi.com/v1/history.json', {
      params: { key: config.weatherApiKey, q: req.query.location, dt: req.query.date }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Historical weather lookup failed:', error.message);
    res.status(500).json({ message: 'An error occurred' });
  }
});

// A valid hash of an unguessable value, compared against when the email is unknown so
// that failed logins cost the same time whether or not the account exists.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(require('crypto').randomBytes(32).toString('hex'), 10);

// Mongoose errors embed the submitted values (error.keyValue, error.errors[].value),
// so only the message is logged to keep personal data out of the log files.
function logError(context, error) {
  console.error(`${context}:`, error.message);
}

function createToken(user) {
  return jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
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
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
}

// SIGNUP route
app.post('/api/auth/signup', signupLimiter, async (req, res) => {
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
    logError('Signup failed', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

// LOGIN route
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const user = await User.findOne({ email });

    // Always run a comparison, even for an unknown email. Returning early would
    // make "no such account" measurably faster and leak which emails are registered.
    const hash = user ? user.password : DUMMY_PASSWORD_HASH;
    const isMatch = await bcrypt.compare(password, hash);

    if (!user || !isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    user.lastLoginAt = new Date();
    await user.save();

    res.json({ token: createToken(user), user: toPublicUser(user) });
  } catch (error) {
    logError('Login failed', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

// Returns the logged-in user for a valid token, used to restore sessions on app load
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

// UK GDPR Art 15/20 — everything held about the requester, in a portable format.
// Deliberately excludes the password hash, which is a credential rather than
// information about the user.
app.get('/api/account/export', requireAuth, (req, res) => {
  const user = req.user;
  res.json({
    exportedAt: new Date().toISOString(),
    account: {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt ?? null,
    },
  });
});

// UK GDPR Art 17 — erasure. Requires the current password so that a stolen
// token alone cannot destroy an account.
app.delete('/api/account', requireAuth, async (req, res) => {
  try {
    const password = req.body?.password || '';
    if (!password) {
      return res.status(400).json({ message: 'Your password is required to delete your account' });
    }

    const isMatch = await bcrypt.compare(password, req.user.password);
    if (!isMatch) return res.status(403).json({ message: 'Password is incorrect' });

    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Your account and all associated data have been deleted' });
  } catch (error) {
    logError('Account deletion failed', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});
