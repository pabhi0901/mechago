import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useSocket } from "../context/SocketContext";
import { Send, MessageSquare, WifiOff, Wifi, Loader } from "lucide-react";

const ChatWindow = ({ senderId, receiverId, receiverName }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [sendError, setSendError] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Track live socket connection status
  useEffect(() => {
    if (!socket) {
      setSocketConnected(false);
      return;
    }

    // Set initial state based on current socket status
    setSocketConnected(socket.connected);

    const handleConnect = () => {
      console.log("ChatWindow: socket connected");
      setSocketConnected(true);
      setSendError("");
    };
    const handleDisconnect = () => {
      console.log("ChatWindow: socket disconnected");
      setSocketConnected(false);
    };
    const handleConnectError = (err) => {
      console.error("ChatWindow: socket connect_error", err?.message);
      setSocketConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [socket]);

  // Fetch past messages on mount / when conversation partner changes
  useEffect(() => {
    if (!senderId || !receiverId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/mechanic/messages?limit=50");
        if (response.data?.success) {
          const convoMessages = response.data.data
            .filter(
              (msg) =>
                (msg.senderId === senderId && msg.receiverId === receiverId) ||
                (msg.senderId === receiverId && msg.receiverId === senderId)
            )
            .reverse(); // backend returns newest-first; reverse for chronological display
          setMessages(convoMessages);
        }
      } catch (error) {
        console.error("Error fetching message history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [senderId, receiverId]);

  // Listen for incoming real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage) => {
      const belongsToUs =
        (newMessage.senderId === receiverId && newMessage.receiverId === senderId) ||
        (newMessage.senderId === senderId && newMessage.receiverId === receiverId);

      if (belongsToUs) {
        setMessages((prev) => {
          // Deduplicate: skip if we already have this _id
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      }
    };

    socket.on("receive-message", handleReceiveMessage);
    return () => socket.off("receive-message", handleReceiveMessage);
  }, [socket, senderId, receiverId]);

  // Auto-scroll to newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    (e) => {
      e.preventDefault();
      const text = inputText.trim();
      if (!text) return;

      setSendError("");

      if (!socket || !socket.connected) {
        setSendError("Socket not connected — retrying connection. Please wait a moment.");
        // Attempt to reconnect if socket exists but is disconnected
        if (socket && !socket.connected) {
          socket.connect();
        }
        return;
      }

      // Emit via socket — backend saves to DB and broadcasts to receiver
      socket.emit("send-message", {
        senderId,
        receiverId,
        message: text,
      });

      // Optimistically add our own message locally
      const localMsg = {
        _id: `local-${Date.now()}-${Math.random()}`,
        senderId,
        receiverId,
        message: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, localMsg]);
      setInputText("");
      inputRef.current?.focus();
    },
    [socket, senderId, receiverId, inputText]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSend(e);
    }
  };

  return (
    <div className="glass-panel flex flex-col h-[450px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="bg-slate-900/80 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-100">{receiverName}</h4>
            <span
              className={`text-[10px] flex items-center gap-1 font-medium mt-0.5 transition-colors ${
                socketConnected ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {socketConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  Live chat active
                </>
              ) : (
                <>
                  <Loader className="w-3 h-3 animate-spin" />
                  Connecting…
                </>
              )}
            </span>
          </div>
        </div>

        {/* Connection status dot */}
        <span
          className={`w-2 h-2 rounded-full transition-colors ${
            socketConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
          }`}
        />
      </div>

      {/* Message body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/20">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] text-slate-500 font-medium">Syncing chat log…</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <MessageSquare className="w-8 h-8 mb-2 text-slate-600 animate-pulse" />
            <p className="text-xs font-medium text-slate-400">No messages yet</p>
            <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">
              Send a message to start chatting about the emergency.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === senderId;
            const time = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={msg._id}
                className={`flex flex-col max-w-[78%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/15"
                      : "bg-slate-800/80 text-slate-100 rounded-bl-none border border-slate-700/50"
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[9px] text-slate-500 mt-0.5 font-medium px-1">{time}</span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Send error banner */}
      {sendError && (
        <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-[10px] text-amber-400 font-medium">{sendError}</span>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-slate-900/60 border-t border-slate-800 flex gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={socketConnected ? "Type a message…" : "Connecting to chat…"}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/15 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
