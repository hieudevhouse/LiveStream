const ProductService = require('../models/ProductService');
const BusinessOwner = require('../models/BusinessOwner');
const VectorDocument = require('../models/vectorDocument');
const { createEmbedding } = require('../services/embedding.service');
const { removeAccents, generateSearchVariations } = require('../utils/vietnamese-search');
const { cosineSimilarity } = require('../utils/vector-similarity');

class ProductController {
  // Get all products with filtering and pagination
  async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        businessOwnerId,
        search,
        minPrice,
        maxPrice,
        sort = 'createdAt',
        order = 'desc'
      } = req.query;

      const query = {};

      // Add businessOwner filter
      if (businessOwnerId) {
        query.businessOwnerId = businessOwnerId;
      }

      // Add price range filter
      if (minPrice || maxPrice) {
        query['pricing.baseCost'] = {};
        if (minPrice) query['pricing.baseCost'].$gte = parseFloat(minPrice);
        if (maxPrice) query['pricing.baseCost'].$lte = parseFloat(maxPrice);
      }

      // Semantic search IDs
      let vectorProductIds = [];
      if (search) {
        try {
          const queryEmbedding = await createEmbedding(search);
          if (queryEmbedding && queryEmbedding.length > 0) {
            const vectorDocs = await VectorDocument.find({
              refType: 'product_service',
              embedding: { $exists: true, $type: "array" }
            }).lean();
            if (vectorDocs.length > 0) {
              vectorProductIds = vectorDocs
                .map(doc => ({
                  refId: doc.refId,
                  similarity: cosineSimilarity(queryEmbedding, doc.embedding)
                }))
                .filter(match => match.similarity > 0.45)
                .map(m => m.refId);
            }
          }
        } catch (e) {
          console.warn('Vector search failed in getProducts:', e.message);
        }
      }

      // Add search filter
      if (search) {
        const variations = generateSearchVariations(search);
        const searchRegexes = variations.map(v => new RegExp(v, 'i'));
        
        query.$or = [
          { name: { $in: searchRegexes } },
          { businessField: { $in: searchRegexes } },
          { 'description.general': { $in: searchRegexes } },
          { 'description.keywords': { $in: searchRegexes } }
        ];

        if (vectorProductIds.length > 0) {
          query.$or.push({ _id: { $in: vectorProductIds } });
        }
      }

      // Build sort object
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortObj = {};
      sortObj[sort] = sortOrder;

      const products = await ProductService.find(query)
        .populate('businessOwnerId', 'businessName logo website')
        .sort(sortObj)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-__v');

      const total = await ProductService.countDocuments(query);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalProducts: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching products'
      });
    }
  }

  async getProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await ProductService.findById(id)
        .populate('businessOwnerId', 'businessName logo website description address email phone individualAddress individualEmail individualPhone contactRepresentative.email contactRepresentative.phone contactRepresentative.name');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Sản phẩm/dịch vụ không tìm thấy'
        });
      }

      // Get related products from same business
      let relatedProducts = [];
      if (product.businessOwnerId) {
        relatedProducts = await ProductService.find({
          businessOwnerId: product.businessOwnerId._id,
          _id: { $ne: product._id }
        })
          .limit(4)
          .select('name businessField description.general description.images');
      }

      res.json({
        success: true,
        data: {
          product,
          relatedProducts
        }
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product'
      });
    }
  }

  // Get products by business/brand
  async getProductsByBrand(req, res) {
    try {
      const { brandId } = req.params;
      const { page = 1, limit = 12 } = req.query;

      // Verify business exists
      const business = await BusinessOwner.findById(brandId);
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Nhãn hàng/doanh nghiệp không tìm thấy'
        });
      }

      const products = await ProductService.find({ businessOwnerId: brandId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await ProductService.countDocuments({ businessOwnerId: brandId });

      res.json({
        success: true,
        data: {
          brand: business,
          products,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalProducts: total
          }
        }
      });
    } catch (error) {
      console.error('Error fetching products by brand:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching products'
      });
    }
  }

  // Get all brands (business owners)
  async getAllBrands(req, res) {
    try {
      const brands = await BusinessOwner.find()
        .select('businessName logo website description address')
        .sort({ createdAt: -1 });

      // Get product count for each brand
      const brandsWithCount = await Promise.all(brands.map(async (brand) => {
        const count = await ProductService.countDocuments({ businessOwnerId: brand._id });
        return {
          ...brand.toObject(),
          productCount: count
        };
      }));

      res.json({
        success: true,
        data: brandsWithCount
      });
    } catch (error) {
      console.error('Error fetching brands:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching brands'
      });
    }
  }

  // Get featured products
  async getFeaturedProducts(req, res) {
    try {
      const { limit = 8 } = req.query;

      const products = await ProductService.find()
        .populate('businessOwnerId', 'businessName logo')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .select('name businessField description.images description.general');

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Error fetching featured products:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching featured products'
      });
    }
  }

  // Search products with smart logic (Vector + Text)
  async searchProducts(req, res) {
    try {
      const { q: searchTerm, limit = 10 } = req.query;

      if (!searchTerm) {
        return res.json({
          success: true,
          data: []
        });
      }

      console.log(`🔍 Smart search for: "${searchTerm}"`);
      let productIds = [];
      let searchMethod = 'regex';

      // 1. Try Vector Search (Semantic)
      try {
        const queryEmbedding = await createEmbedding(searchTerm);
        if (queryEmbedding && queryEmbedding.length > 0) {
          const vectorDocs = await VectorDocument.find({
            refType: 'product_service',
            embedding: { $exists: true, $type: "array" }
          }).lean();

          if (vectorDocs.length > 0) {
            const matches = vectorDocs
              .map(doc => ({
                refId: doc.refId,
                similarity: cosineSimilarity(queryEmbedding, doc.embedding)
              }))
              .filter(match => match.similarity > 0.45) // Threshold for semantic relevance
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, parseInt(limit));

            if (matches.length > 0) {
              productIds = matches.map(m => m.refId);
              searchMethod = 'vector';
              console.log(`✅ Vector search found ${productIds.length} matches`);
            }
          }
        }
      } catch (vectorError) {
        console.warn('⚠️ Vector search failed or not available:', vectorError.message);
      }

      let products = [];

      // 2. If Vector search found results, fetch them
      if (productIds.length > 0) {
        products = await ProductService.find({ _id: { $in: productIds } })
          .populate('businessOwnerId', 'businessName logo')
          .select('name businessField description.general description.images');
        
        // Respect vector sorting
        products.sort((a, b) => productIds.indexOf(a._id.toString()) - productIds.indexOf(b._id.toString()));
      }

      // 3. Fallback/Supplement with Smart Text Search if needed
      if (products.length < parseInt(limit)) {
        const variations = generateSearchVariations(searchTerm);
        const searchRegexes = variations.map(v => new RegExp(v, 'i'));
        
        const textQuery = {
          _id: { $nin: productIds }, // Don't duplicate vector results
          $or: [
            { name: { $in: searchRegexes } },
            { businessField: { $in: searchRegexes } },
            { 'description.general': { $in: searchRegexes } },
            { 'description.keywords': { $in: searchRegexes } }
          ]
        };

        const remainingLimit = parseInt(limit) - products.length;
        const textProducts = await ProductService.find(textQuery)
          .populate('businessOwnerId', 'businessName logo')
          .limit(remainingLimit)
          .select('name businessField description.general description.images');
        
        if (textProducts.length > 0) {
          console.log(`✅ Text search added ${textProducts.length} matches`);
          products = [...products, ...textProducts];
          if (searchMethod === 'regex' && products.length > 0) searchMethod = 'smart-text';
        }
      }

      res.json({
        success: true,
        searchMethod,
        data: products
      });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching products'
      });
    }
  }
}

module.exports = new ProductController();