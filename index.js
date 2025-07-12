// Required imports and middleware
const express = require('express');
const app = express();
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
  secret: 'skillSwapSecret',
  resave: false,
  saveUninitialized: false,
}));

const users = []; // Temp in-memory user store

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/views/register.html');
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.send(`<h1>Welcome, ${req.session.user.name}</h1><a href="/logout">Logout</a>`);
});

// User API for frontend (public profiles)
app.get('/api/users', (req, res) => {
  res.json(users.filter(u => u.isPublic));
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.sendFile(__dirname + '/views/dashboard.html');
});

app.get('/session', (req, res) => {
  res.json(req.session.user || null);
});

// Registration route (POST)
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = users.find(u => u.email === email);
  if (existingUser) return res.send('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    name,
    email,
    password: hashedPassword,
    isPublic: true // default setting for now
  };

  users.push(newUser);
  res.redirect('/login');
});

// Login route (POST)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user) return res.send('User not found');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send('Invalid password');

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email
  };

  res.redirect('/dashboard');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(__dirname + '/views/profile.html');
});

app.get('/api/user/:id', (req, res) => {
  const user = users.find(u => u.id == req.params.id);
  if (!user) return res.status(404).send('User not found');
  res.json(user);
});

const swapRequests = []; // Add this once near the top, like the users array

app.post('/api/swap-request', (req, res) => {
  const { userId, yourSkill, theirSkill, message } = req.body;
  const fromUser = req.session.user;
  if (!fromUser) return res.status(401).send('Login first');

  swapRequests.push({
    id: Date.now(),
    from: fromUser.id,
    to: parseInt(userId),
    yourSkill,
    theirSkill,
    message,
    status: 'Pending'
  });

  res.send('Swap request sent!');
});

app.get('/swap_requests', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(__dirname + '/views/swap_requests.html');
});

app.get('/api/swap-requests', (req, res) => {
  const currentUser = req.session.user;
  if (!currentUser) return res.status(401).send('Login required');

  const received = swapRequests
    .filter(r => r.to === currentUser.id)
    .map(r => ({
      ...r,
      fromName: users.find(u => u.id === r.from)?.name || 'Unknown'
    }));

  const sent = swapRequests
    .filter(r => r.from === currentUser.id)
    .map(r => ({
      ...r,
      toName: users.find(u => u.id === r.to)?.name || 'Unknown'
    }));

  res.json({ received, sent });
});
app.put('/api/swap-request/:id', (req, res) => {
  const { status } = req.body;
  const request = swapRequests.find(r => r.id == req.params.id);
  if (!request) return res.status(404).send('Request not found');

  request.status = status;
  res.send('Status updated');
});
app.delete('/api/swap-request/:id', (req, res) => {
  const index = swapRequests.findIndex(r => r.id == req.params.id);
  if (index === -1) return res.status(404).send('Request not found');

  const reqToDelete = swapRequests[index];
  if (reqToDelete.status !== 'Pending') return res.status(400).send('Only pending requests can be deleted');

  swapRequests.splice(index, 1);
  res.send('Request deleted');
});

// Start server
app.listen(3000, () => console.log('Server started on http://localhost:3000'));
