import express from 'express';

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Test endpoints
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running on port 5000!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy', timestamp: new Date() });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  res.json({
    success: true,
    token: 'test-token-123',
    user: {
      id: 1,
      name: 'Test User',
      email: email || 'test@example.com',
      role: 'PATIENT'
    }
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`✅ Simple backend server is RUNNING!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});