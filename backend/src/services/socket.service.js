import { Server } from "socket.io";
import Message from "../models/message.model.js";

const onlineUsers = new Map();
let ioInstance = null;

const initializeSocket = (server) => {
	const io = new Server(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"]
		}
	});

	ioInstance = io;

	io.on("connection", (socket) => {
		const userId = socket.handshake.query.userId;
		if (userId) {
			console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
			onlineUsers.set(userId, socket.id);
			socket.join(userId); // User joins a room with their own ID

			// Broadcast online users to all clients (optional, but good for debugging)
			io.emit("online-users", Array.from(onlineUsers.keys()));
		}

		socket.on("send-message", async ({ senderId, receiverId, message }) => {
			try {
				const newMessage = await Message.create({
					senderId,
					receiverId,
					message
				});

				const receiverSocketId = onlineUsers.get(receiverId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("receive-message", newMessage);
				}
			} catch (err) {
				console.error("Error saving and sending message:", err);
			}
		});

		socket.on("disconnect", () => {
			if (userId) {
				console.log(`User disconnected: ${userId}`);
				onlineUsers.delete(userId);
				// Broadcast updated online users
				io.emit("online-users", Array.from(onlineUsers.keys()));
			}
		});
	});

	return io;
};

const getReceiverSocketId = (receiverId) => {
	return onlineUsers.get(receiverId);
};

const getIo = () => {
	return ioInstance;
};

export { initializeSocket, getReceiverSocketId, getIo };