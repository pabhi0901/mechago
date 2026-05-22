import dotenv from "dotenv";
import app from "./src/app.js";
import connectToDatabase from "./src/db/db.js";
import http from "http";
import { initializeSocket } from "./src/services/socket.service.js";

dotenv.config();

connectToDatabase();

const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

export { io };

server.listen(process.env.PORT, () => {
	console.log(`Server is running on port ${process.env.PORT}`);
});