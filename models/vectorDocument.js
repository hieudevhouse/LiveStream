const mongoose = require("mongoose");

const vectorDocumentSchema = new mongoose.Schema({

  refId: {
    type: String,
    required: true,
    index: true
  },

  refType: {
    type: String,
    enum: [
      "business_owner",
      "product_service",
      "collaboration_need"
    ],
    required: true
  },

  title: String,

  content: String,

  // Normalized Vietnamese text (without accents) for better text search
  normalizedContent: String,

  embedding: {
    type: [Number],
    required: true
  },

  metadata: {
    type: Object
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

vectorDocumentSchema.index({
  embedding: "2dsphere"
});

// Create text index for better text search
vectorDocumentSchema.index({
  title: "text",
  content: "text",
  normalizedContent: "text"
});

module.exports = mongoose.model(
  "VectorDocument",
  vectorDocumentSchema
);