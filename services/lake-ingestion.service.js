const cron = require('node-cron');
const mongoose = require('mongoose');
const { LAKE_INGEST_INTERVAL } = require('../config/cron');
const connectLakehouseDB = require('../config/db-lakehouse');

const opConn = mongoose.connection;

let lakeConn = null;
let cronJob = null;

const INGEST_WINDOW_MINUTES = 6;

// ===== Helper =====

// Format YYYY_DD_MM
const getDateParts = () => {
  const now = new Date();
  return {
    yyyy: now.getFullYear(),
    mm: String(now.getMonth() + 1).padStart(2, '0'),
    dd: String(now.getDate()).padStart(2, '0')
  };
};

const getCollectionName = (source) => {
  const { yyyy, mm, dd } = getDateParts();
  return `Ingest_Bronze_${source}_${yyyy}_${dd}_${mm}`;
};

const getTimeWindow = () => {
  return new Date(Date.now() - INGEST_WINDOW_MINUTES * 60 * 1000);
};

// ===== Config =====
const COLLECTIONS = [
  { name: 'users', source: 'User' },
  { name: 'businessowners', source: 'BusinessOwner' },
  { name: 'productservices', source: 'ProductService' },
  { name: 'collaborationneeds', source: 'CollaborationNeed'}
];

// ===== Core Ingest =====
const ingestCollectionToBronze = async ({ name, source }) => {
  const timeWindow = getTimeWindow();

  const docs = await opConn.collection(name)
    .find({ updatedAt: { $gte: timeWindow } })
    .toArray();

  if (!docs.length) {
    console.log(`   ⚠️ ${source}: No new data`);
    return;
  }

  const collectionName = getCollectionName(source);

  const bronzeData = docs.map(doc => ({
    ...doc,
    originalId: doc._id,   // giữ id gốc
    _id: undefined,        // tránh duplicate
    layer: 'bronze',
    source,
    ingestedAt: new Date()
  }));

  await lakeConn.collection(collectionName).insertMany(bronzeData);

  // Update trạng thái ingest bên DB chính
  await opConn.collection(name).updateMany(
    { _id: { $in: docs.map(d => d._id) } },
    {
      $set: {
        ingestStatus: 'bronze',
        ingestedAt: new Date()
      }
    }
  );

  console.log(`   ✅ ${source} → ${collectionName}: ${docs.length} records`);
};

// ===== Main Job =====
const runLakehouseIngestion = async () => {
  if (!lakeConn) {
    try {
      lakeConn = await connectLakehouseDB();
    } catch (err) {
      console.error('❌ Cannot connect lakehouse DB:', err.message);
      return;
    }
  }

  const startTime = new Date();

  console.log(`\n🚀 [BRONZE INGEST START] ${startTime.toISOString()}`);

  try {
    for (const col of COLLECTIONS) {
      await ingestCollectionToBronze(col);
    }

    const duration = ((Date.now() - startTime.getTime()) / 1000).toFixed(2);

    console.log(`🎉 DONE Bronze ingest in ${duration}s\n`);

  } catch (err) {
    console.error('❌ Bronze ingest error:', err.message);
  }
};

// ===== Cron Control =====
const startCron = () => {
  if (cronJob) {
    console.warn('⏰ Cron already running');
    return;
  }

  cronJob = cron.schedule(LAKE_INGEST_INTERVAL, runLakehouseIngestion);

  console.log('⏰ Bronze ingest cron started');
};

const stopCron = () => {
  if (!cronJob) return;

  cronJob.stop();
  cronJob = null;

  console.log('⏰ Bronze ingest cron stopped');
};

module.exports = {
  startCron,
  stopCron
};