const ProductService = require("./ProductService");
const { indexProductService } = require("../services/vector.service");

// Add post-save hook to automatically index product
ProductService.schema.post("save", async function(doc) {
  try {
    await indexProductService(doc);
  } catch (error) {
    console.error(`Error indexing product ${doc._id}:`, error.message);
  }
});

module.exports = ProductService;