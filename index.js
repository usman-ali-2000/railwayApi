const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// CORS configuration for both local development and production
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

const userSockets = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register user with profile ID
    socket.on('registerUser', (profileId) => {
        userSockets[profileId] = socket.id;
        console.log(`User registered with profile ID: ${profileId}`);
    });

    // Send message from sender to receiver
    socket.on('sendMessage', (content) => {
        const { senderId, receiverId, message } = content;
        const receiverSocketId = userSockets[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiveMessage', { senderId, message });
        } else {
            console.log(`Receiver with ID ${receiverId} not found`);
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        for (let [profileId, socketId] of Object.entries(userSockets)) {
            if (socketId === socket.id) {
                delete userSockets[profileId];
                console.log(`User with profile ID ${profileId} disconnected`);
                break;
            }
        }
    });
});

// Use the PORT environment variable from Railway, default to 3000 for local dev
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
