const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
const taskRoutes = require('./routes/tasks');
app.use('/tasks', taskRoutes);

// Fallback: serve index.html for any unknown route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅  TaskFlow server running at http://localhost:${PORT}`);
});
