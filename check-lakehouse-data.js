const connectLakehouseDB = require('./config/db-lakehouse');

async function checkLakehouseDB() {
  try {
    const lakeConnection = await connectLakehouseDB();
    console.log('Connected to Lakehouse DB');
    const collections = await lakeConnection.db.listCollections().toArray();
    for (const col of collections) {
      const count = await lakeConnection.db.collection(col.name).countDocuments();
      console.log(`${col.name}: ${count} documents`);
    }
    await lakeConnection.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkLakehouseDB();