import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, set, onValue, off } from "firebase/database";
import { db } from "@/firebase/config";
import io from "socket.io-client";
import { Send, Bot, User as UserIcon, Loader2, Copy, CheckCircle, Wifi, WifiOff } from "lucide-react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function GroupChat({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [joinNotification, setJoinNotification] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const userId = localStorage.getItem("studyArena_userId");
  const username = localStorage.getItem("studyArena_username");

  /**
   * Initialize Socket.IO connection
   */
  useEffect(() => {
    console.log("🔌 Connecting to Socket.IO...");

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Connection handlers
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setIsConnected(true);

      // Join the room
      socket.emit("room:join", { roomId, userId, userName: username });
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      setIsConnected(false);
    });

    // Load chat history
    socket.on("chat:history", ({ messages: historyMessages }) => {
      console.log("📜 Loaded chat history:", historyMessages.length, "messages");
      setMessages(historyMessages);
    });

    // Receive new user message
    socket.on("chat:message", (message) => {
      console.log("💬 New message:", message);
      setMessages((prev) => [...prev, message]);
    });

    // Receive AI response
    socket.on("chat:aiResponse", (message) => {
      console.log("🤖 AI response:", message);
      setMessages((prev) => [...prev, message]);
      setIsSending(false);
    });

    // Typing indicator from other users
    socket.on("chat:userTyping", ({ userId: typingUserId, userName, isTyping: typing }) => {
      if (typing && typingUserId !== userId) {
        setTypingUser(userName);
      } else {
        setTypingUser(null);
      }
    });

    // User joined notification
    socket.on("room:userJoined", ({ userName }) => {
      console.log("👤 User joined:", userName);
      setJoinNotification(`${userName} joined the room`);
      setTimeout(() => setJoinNotification(null), 3000);
    });

    // User left notification
    socket.on("room:userLeft", ({ userName }) => {
      console.log("👋 User left:", userName);
      setJoinNotification(`${userName} left the room`);
      setTimeout(() => setJoinNotification(null), 3000);
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });

    return () => {
      console.log("🔌 Disconnecting socket...");
      socket.emit("room:leave", { roomId, userId, userName: username });
      socket.off();
      socket.disconnect();
    };
  }, [roomId, userId, username]);

  /**
   * Firebase RTDB typing indicator (ultra-fast)
   * Path: rooms/<roomId>/typing/<userId>
   */
  useEffect(() => {
    const typingRef = ref(db, `rooms/${roomId}/typing`);

    const unsubscribe = onValue(typingRef, (snapshot) => {
      const typingData = snapshot.val();
      if (typingData) {
        // Find first user who is typing (not current user)
        const typingUserId = Object.keys(typingData).find(
          (id) => id !== userId && typingData[id]
        );
        
        if (typingUserId) {
          // Get username from typing data or use "Someone"
          const typingUserName = typingData[typingUserId]?.username || "Someone";
          setTypingUser(typingUserName);
        } else {
          setTypingUser(null);
        }
      } else {
        setTypingUser(null);
      }
    });

    return () => {
      // Clear own typing indicator on unmount
      const myTypingRef = ref(db, `rooms/${roomId}/typing/${userId}`);
      set(myTypingRef, null);
      off(typingRef, "value", unsubscribe);
    };
  }, [roomId, userId]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Handle typing with debouncing for Firebase RTDB
   */
  const handleTypingChange = (isTypingNow) => {
    const typingRef = ref(db, `rooms/${roomId}/typing/${userId}`);

    if (isTypingNow) {
      // Set typing to true with username
      set(typingRef, { username, isTyping: true });

      // Emit typing status via Socket.IO for backup
      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:typing", {
          roomId,
          userId,
          userName: username,
          isTyping: true,
        });
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to clear typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        set(typingRef, null);
        if (socketRef.current?.connected) {
          socketRef.current.emit("chat:typing", {
            roomId,
            userId,
            userName: username,
            isTyping: false,
          });
        }
      }, 2000);
    } else {
      // Clear typing immediately
      set(typingRef, null);
      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:typing", {
          roomId,
          userId,
          userName: username,
          isTyping: false,
        });
      }
    }
  };

  /**
   * Send message via Socket.IO
   * Backend will save to MongoDB and get AI response
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending || !socketRef.current?.connected) return;

    const messageText = inputValue.trim();
    setInputValue("");
    setIsSending(true);
    handleTypingChange(false);

    try {
      // Send message via Socket.IO
      socketRef.current.emit("chat:send", {
        roomId,
        userId,
        userName: username,
        text: messageText,
      });

      console.log("📤 Message sent:", messageText);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedRoomCode(true);
    setTimeout(() => setCopiedRoomCode(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-bgDark2/40 backdrop-blur-xl rounded-2xl border border-white/10">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-bgDark3/30">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-neonPurple" />
              Shared AI Chat
            </h2>
            <p className="text-xs text-white/60 flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">Disconnected</span>
                </>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={copyRoomCode}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neonPurple/40 rounded-lg transition-all duration-300 group"
        >
          {copiedRoomCode ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-white/60 group-hover:text-neonPurple" />
              <span className="text-sm text-white/80 font-mono">{roomId}</span>
            </>
          )}
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neonPink/20 to-neonPurple/20 border border-neonPurple/40 flex items-center justify-center mb-4"
            >
              <Bot className="w-8 h-8 text-neonPurple" />
            </motion.div>
            <p className="text-white/60 mb-2">Start your collaborative study session</p>
            <p className="text-xs text-white/40">
              Real-time AI assistant powered by Gemini & Groq
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isAssistant = message.sender === "assistant";
              const isCurrentUser = message.userId === userId;

              return (
                <motion.div
                  key={message._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex gap-3 ${isCurrentUser && !isAssistant ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isAssistant
                        ? "bg-gradient-to-br from-neonPurple/30 to-neonPink/30 border border-neonPurple/40"
                        : isCurrentUser
                        ? "bg-gradient-to-br from-neonPink to-neonPurple"
                        : "bg-bgDark3/80 border border-white/20"
                    }`}
                  >
                    {isAssistant ? (
                      <Bot className="w-5 h-5 text-neonPurple" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[75%] ${isCurrentUser && !isAssistant ? "items-end" : "items-start"}`}>
                    {/* Username */}
                    {!isAssistant && (
                      <p className={`text-xs text-white/60 mb-1 px-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                        {message.userName || message.username || "User"}
                      </p>
                    )}

                    {/* Message Content */}
                    <div
                      className={`px-4 py-3 rounded-2xl backdrop-blur-xl transition-all duration-300 ${
                        isAssistant
                          ? "bg-gradient-to-br from-neonPurple/20 to-neonPink/20 border border-neonPurple/30 rounded-tl-sm"
                          : isCurrentUser
                          ? "bg-gradient-to-br from-neonPink/20 to-neonPurple/20 border border-neonPink/30 rounded-tr-sm"
                          : "bg-bgDark3/50 border border-white/10 rounded-tl-sm hover:border-white/20"
                      }`}
                    >
                      <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                        {message.text || message.message}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <div className={`text-xs text-white/40 mt-1 px-1 ${isCurrentUser && !isAssistant ? "text-right" : "text-left"}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Typing Indicator */}
            {typingUser && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-bgDark3/80 border border-white/20 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
                </div>
                <div className="bg-bgDark3/50 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <p className="text-xs text-white/60 mb-2">{typingUser} is typing...</p>
                  <div className="flex gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-white/60 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-white/60 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-white/60 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4">
        {!isConnected && (
          <div className="mb-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400 text-center">
              ⚠️ Reconnecting to server...
            </p>
          </div>
        )}
        
        {joinNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg"
          >
            <p className="text-xs text-green-400 text-center flex items-center justify-center gap-2">
              <UserIcon className="w-3 h-3" />
              {joinNotification}
            </p>
          </motion.div>
        )}
        
        {typingUser && (
          <div className="mb-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-400 text-center">
              {typingUser} is typing... (input disabled)
            </p>
          </div>
        )}

        <div className="flex items-end gap-2 bg-bgDark3/50 backdrop-blur-xl rounded-xl border border-white/10 p-3 focus-within:border-neonPurple/40 transition-colors duration-300">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              handleTypingChange(e.target.value.length > 0);
            }}
            onKeyPress={handleKeyPress}
            placeholder={typingUser ? `${typingUser} is typing...` : "Ask a question or share your thoughts..."}
            rows={1}
            disabled={!isConnected || !!typingUser}
            className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none resize-none max-h-32 px-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: "36px" }}
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending || !isConnected || !!typingUser}
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-neonPink to-neonPurple hover:from-neonPink/80 hover:to-neonPurple/80 disabled:from-white/10 disabled:to-white/10 border border-neonPink/40 disabled:border-white/10 flex items-center justify-center transition-all duration-300 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
