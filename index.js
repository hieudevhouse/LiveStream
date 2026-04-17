// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// require('dotenv').config();

// const { connectDB } = require('./config/db');
// const connectLakehouseDB = require('./config/db-lakehouse');

// const vectorRoute = require("./routes/vector.route");

// const app = express(); // ✅ Khai báo trước

// const PORT = process.env.PORT || 5002;

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.set("view engine", "ejs");
// app.set("views", "./views");

// app.use('/', require('./routes/register'));
// app.use('/products', require('./routes/productPages'));
// app.use("/vector", vectorRoute);

// // Route modules
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/auth', require('./routes/auth-temp'));
// app.use('/api/business-owners', require('./routes/businessOwners'));
// app.use('/api/products-services', require('./routes/productsServices'));
// app.use('/api/collaboration-needs', require('./routes/collaborationNeeds'));
// app.use('/api/products', require('./routes/products'));
// app.use('/api/orders', require('./routes/orders'));
// app.use('/api/vouchers', require('./routes/vouchers'));
// app.use('/admin', require('./routes/admin'));

// app.use('/api/health', (req, res) => {
//   res.status(200).json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime()
//   });
// });

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// const lakeIngestion = require('./services/lake-ingestion.service');

// connectDB()
//   .then(() => connectLakehouseDB())
//   .then((lakeConn) => {

//     lakeIngestion.startCron();

//     app.listen(PORT, '0.0.0.0', () => {
//       console.log(`Server running on port ${PORT}`);
//     });

//   })
//   .catch(err => {
//     console.error('Failed to start server due to db error');
//     process.exit(1);
//   });

// app.use((error, req, res, next) => {
//   if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
//     return res.status(400).json({ message: 'File too large' });
//   }

//   res.status(500).json({
//     message: error.message || 'Internal Server Error'
//   });
// });

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');
const connectLakehouseDB = require('./config/db-lakehouse');

const vectorRoute = require("./routes/vector.route");

const app = express();

const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View Engine
const path = require('path');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Page routes
app.use('/', require('./routes/register'));
app.use('/products', require('./routes/productPages'));
app.use("/vector", vectorRoute);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/auth-temp'));
app.use('/api/business-owners', require('./routes/businessOwners'));
app.use('/api/products-services', require('./routes/productsServices'));
app.use('/api/collaboration-needs', require('./routes/collaborationNeeds'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/admin', require('./routes/admin'));

// Health check
app.use('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Services
const lakeIngestion = require('./services/lake-ingestion.service');

// Database connection
const startServer = async () => {
  try {
    await connectDB();
    await connectLakehouseDB();

    // lakeIngestion.startCron();
    if (process.env.NODE_ENV !== 'production') {
      lakeIngestion.startCron();
    }
    // chỉ listen khi chạy local
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });
    }

  } catch (err) {
    console.error('Failed to start server due to db error', err);
  }
};

startServer();

// Error handler
app.use((error, req, res, next) => {
  if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large' });
  }

  res.status(500).json({
    message: error.message || 'Internal Server Error'
  });
});

// Export cho Vercel
module.exports = app;