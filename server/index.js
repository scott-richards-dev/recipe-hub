const express = require('express');
const cors = require('cors');
const path = require('path');
const recipesRouter = require('./routes/recipes');
const booksRouter = require('./routes/books');
const compareRouter = require('./routes/compare');
const versionsRouter = require('./routes/versions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/recipes', recipesRouter);
app.use('/api/books', booksRouter);
app.use('/api/compare', compareRouter);
app.use('/api/versions', versionsRouter);

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
