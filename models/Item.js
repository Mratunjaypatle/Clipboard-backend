const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'image', 'pdf'],
      required: [true, 'Type is required'],
    },
    textContent: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Text search index
itemSchema.index({ title: 'text', textContent: 'text', tags: 'text' });

module.exports = mongoose.model('Item', itemSchema);
