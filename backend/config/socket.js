import { Server } from 'socket.io';
import StudyRoomChat from '../models/StudyRoomChat.js';
import { getGroqClient } from '../services/groqService.js';
import { generateAIResponse } from '../utils/geminiClient.js';

let io = null;

/**
 * Initialize Socket.IO server
 */
export const initializeSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow all localhost origins in development
        if (!origin || origin.includes('localhost')) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a study room
    socket.on('room:join', async ({ roomId, userId, userName }) => {
      try {
        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId;
        socket.userName = userName;

        console.log(`👤 ${userName} joined room: ${roomId}`);

        // Load chat history
        let chat = await StudyRoomChat.findOne({ roomId });
        if (!chat) {
          chat = new StudyRoomChat({ roomId, messages: [] });
          await chat.save();
        }

        // Send chat history to the joining user
        socket.emit('chat:history', {
          messages: chat.messages || []
        });

        // Notify others in the room
        socket.to(roomId).emit('room:userJoined', {
          userId,
          userName,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('❌ Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle chat message from user
    socket.on('chat:send', async ({ roomId, userId, userName, text }) => {
      try {
        if (!text || !text.trim()) {
          return socket.emit('error', { message: 'Message cannot be empty' });
        }

        // Save user message to MongoDB
        const chat = await StudyRoomChat.findOne({ roomId });
        if (!chat) {
          return socket.emit('error', { message: 'Room not found' });
        }

        const userMessage = {
          sender: 'user',
          userId,
          userName,
          text: text.trim(),
          timestamp: new Date()
        };

        chat.messages.push(userMessage);
        await chat.save();

        // Broadcast user message to all room members
        io.to(roomId).emit('chat:message', userMessage);

        console.log(`💬 Message in ${roomId} from ${userName}: ${text.substring(0, 50)}...`);

        // Get AI response
        try {
          console.log('🤖 Calling AI for response...');
          
          // Prepare context from recent messages
          const recentMessages = chat.messages.slice(-10);
          const context = recentMessages
            .map(m => `${m.sender === 'user' ? m.userName : 'Assistant'}: ${m.text}`)
            .join('\n');

          const aiPrompt = `You are a helpful study assistant in a collaborative study room. Multiple students are studying together. Previous conversation:\n${context}\n\nProvide a helpful, concise response to help with their studies. Keep responses friendly and educational.`;

          let aiResponseText;
          try {
            aiResponseText = await generateAIResponse(aiPrompt, { temperature: 0.7, max_tokens: 500 });
          } catch (geminiError) {
            console.warn('⚠️  Gemini failed, using Groq fallback');
            const groqClient = getGroqClient();
            const groqResponse = await groqClient.chat.completions.create({
              model: "llama-3.1-70b-versatile",
              messages: [{ role: "user", content: aiPrompt }],
              temperature: 0.7,
              max_tokens: 500
            });
            aiResponseText = groqResponse.choices[0].message.content;
          }

          // Save AI response to MongoDB
          const aiMessage = {
            sender: 'assistant',
            text: aiResponseText,
            timestamp: new Date()
          };

          chat.messages.push(aiMessage);
          await chat.save();

          // Broadcast AI response to all room members
          io.to(roomId).emit('chat:aiResponse', aiMessage);

          console.log(`🤖 AI responded in ${roomId}`);

        } catch (aiError) {
          console.error('❌ AI response error:', aiError);
          
          // Send fallback message
          const fallbackMessage = {
            sender: 'assistant',
            text: 'Sorry, I\'m having trouble responding right now. Please try again.',
            timestamp: new Date()
          };
          
          io.to(roomId).emit('chat:aiResponse', fallbackMessage);
        }

      } catch (error) {
        console.error('❌ Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('chat:typing', ({ roomId, userId, userName, isTyping }) => {
      socket.to(roomId).emit('chat:userTyping', {
        userId,
        userName,
        isTyping
      });
    });

    // Leave room
    socket.on('room:leave', ({ roomId, userId, userName }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('room:userLeft', {
        userId,
        userName,
        timestamp: new Date()
      });
      console.log(`👋 ${userName} left room: ${roomId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.roomId && socket.userName) {
        socket.to(socket.roomId).emit('room:userLeft', {
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date()
        });
        console.log(`❌ ${socket.userName} disconnected from ${socket.roomId}`);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.IO server initialized');
  return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO() first.');
  }
  return io;
};

export default { initializeSocketIO, getIO };
