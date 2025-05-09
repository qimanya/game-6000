import express from 'express';
import http from 'http';
import cors from 'cors';
import { initSocket } from './pages/api/game.js';

const app = express();
const server = http.createServer(app);

// Basic CORS configuration
app.use(cors());

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Basic routes
app.get('/', (req, res) => {
    res.json({ message: 'Game server is running' });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Initialize Socket.IO
const io = initSocket(server);

// Error handling
server.on('error', (error) => {
    console.error('Server error:', error);
});

const PORT = 3001;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 