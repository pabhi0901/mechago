import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (user && user.userId) {
      // Connect through the Vite dev proxy (/socket.io is proxied to :5000 with ws:true)
      // In production this will be the same origin as well.
      const socketUrl = window.location.origin;

      console.log(`Connecting socket to: ${socketUrl} for user: ${user.userId}`);

      const newSocket = io(socketUrl, {
        query: { userId: user.userId },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected successfully, ID:", newSocket.id);
      });

      newSocket.on("online-users", (users) => {
        setOnlineUsers(users);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      // Cleanup function on unmount or user change
      return () => {
        console.log("Disconnecting socket for user:", user.userId);
        newSocket.disconnect();
        setSocket(null);
      };
    } else {
      // If user logs out, disconnect socket if it exists
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  // Utility to send chat message through socket
  const sendMessage = (senderId, receiverId, messageText) => {
    if (socket && socket.connected) {
      socket.emit("send-message", {
        senderId,
        receiverId,
        message: messageText
      });
      return true;
    }
    console.warn("Socket not connected, cannot send message");
    return false;
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
export default SocketContext;
