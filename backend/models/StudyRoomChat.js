import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  userId: {
    type: String,
    required: function() {
      return this.sender === 'user';
    }
  },
  userName: {
    type: String,
    required: function() {
      return this.sender === 'user';
    }
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const studyRoomChatSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt timestamp on save
studyRoomChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
studyRoomChatSchema.index({ roomId: 1, 'messages.timestamp': -1 });

const StudyRoomChat = mongoose.model('StudyRoomChat', studyRoomChatSchema);

export default StudyRoomChat;
