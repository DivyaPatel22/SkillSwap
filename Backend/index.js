require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL pool setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Basic route
app.get('/', (req, res) => {
  res.send('SkillSwap Backend API is running');
});

// User signup
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token });
  } catch (err) {
    if (err.code === '23505') { // unique violation
      res.status(409).json({ message: 'Email already exists' });
    } else {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  try {
    const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileResult = await pool.query(
      'SELECT name, bio, avatar_url FROM profiles WHERE user_id = $1',
      [userId]
    );
    const timeCreditsResult = await pool.query(
      'SELECT credits FROM time_credits WHERE user_id = $1',
      [userId]
    );
    const profile = profileResult.rows[0] || {};
    const timeCredits = timeCreditsResult.rows[0]?.credits || 0;
    res.json({ ...profile, time_credits: timeCredits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, avatar_url } = req.body;
    const existing = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [userId]);
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE profiles SET name = $1, bio = $2, avatar_url = $3 WHERE user_id = $4',
        [name, bio, avatar_url, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO profiles (user_id, name, bio, avatar_url) VALUES ($1, $2, $3, $4)',
        [userId, name, bio, avatar_url]
      );
    }
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user skills
app.get('/api/skills', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, skill_name, description, is_offered FROM skills WHERE user_id = $1',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/skills', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { skill_name, description, is_offered } = req.body;
    const result = await pool.query(
      'INSERT INTO skills (user_id, skill_name, description, is_offered) VALUES ($1, $2, $3, $4) RETURNING id, skill_name, description, is_offered',
      [userId, skill_name, description, is_offered]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all offered skills with user info
app.get('/api/skills/all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT skills.id, skills.skill_name, skills.description, skills.user_id, profiles.name AS user_name
       FROM skills
       JOIN profiles ON skills.user_id = profiles.user_id
       WHERE skills.is_offered = true`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create swap request
app.post('/api/swap-requests', authenticateToken, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { skill_id } = req.body;
    // Get skill owner
    const skillResult = await pool.query('SELECT user_id FROM skills WHERE id = $1', [skill_id]);
    if (skillResult.rows.length === 0) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    const responderId = skillResult.rows[0].user_id;
    if (responderId === requesterId) {
      return res.status(400).json({ message: 'Cannot request your own skill' });
    }
    // Insert swap request
    const result = await pool.query(
      'INSERT INTO swap_requests (requester_id, responder_id, skill_id, status) VALUES ($1, $2, $3, $4) RETURNING id, status',
      [requesterId, responderId, skill_id, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get incoming swap requests
app.get('/api/swap-requests/incoming', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT sr.id, sr.status, s.skill_name, p1.name AS requester_name, p2.name AS responder_name
       FROM swap_requests sr
       JOIN skills s ON sr.skill_id = s.id
       JOIN profiles p1 ON sr.requester_id = p1.user_id
       JOIN profiles p2 ON sr.responder_id = p2.user_id
       WHERE sr.responder_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get outgoing swap requests
app.get('/api/swap-requests/outgoing', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT sr.id, sr.status, s.skill_name, p1.name AS requester_name, p2.name AS responder_name
       FROM swap_requests sr
       JOIN skills s ON sr.skill_id = s.id
       JOIN profiles p1 ON sr.requester_id = p1.user_id
       JOIN profiles p2 ON sr.responder_id = p2.user_id
       WHERE sr.requester_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update swap request status
app.put('/api/swap-requests/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.id;
    const { action } = req.body; // 'accept' or 'reject'

    // Check if user is the responder for this request
    const checkRes = await pool.query(
      'SELECT responder_id FROM swap_requests WHERE id = $1',
      [requestId]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Swap request not found' });
    }
    if (checkRes.rows[0].responder_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let newStatus;
    if (action === 'accept') {
      newStatus = 'accepted';
      // TODO: Deduct time credits, create booking, etc.
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await pool.query(
      'UPDATE swap_requests SET status = $1 WHERE id = $2',
      [newStatus, requestId]
    );

    res.json({ message: `Request ${newStatus}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
