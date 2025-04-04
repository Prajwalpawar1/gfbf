const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 3000 });

server.on("connection", (socket) => {
    console.log("New connection");

    socket.on("message", (message) => {
        // Broadcast the message to all connected clients
        server.clients.forEach(client => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    socket.on("close", () => {
        console.log("Connection closed");
    });
});

console.log("WebSocket server running on ws://localhost:3000");
