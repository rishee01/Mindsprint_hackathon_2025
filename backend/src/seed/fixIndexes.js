/**
 * Fix MongoDB Indexes
 * Drops and recreates the firebaseUid index as sparse
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check current indexes
    console.log('\nCurrent indexes on users collection:');
    const indexes = await usersCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the firebaseUid index if it exists
    try {
      await usersCollection.dropIndex('firebaseUid_1');
      console.log('\n✅ Dropped firebaseUid_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('\n⚠️ firebaseUid_1 index does not exist');
      } else {
        throw err;
      }
    }

    // Update all documents with null firebaseUid to remove the field
    const updateResult = await usersCollection.updateMany(
      { firebaseUid: null },
      { $unset: { firebaseUid: '' } }
    );
    console.log(`\n✅ Removed null firebaseUid from ${updateResult.modifiedCount} documents`);

    // Recreate the index with sparse option
    await usersCollection.createIndex(
      { firebaseUid: 1 },
      { unique: true, sparse: true }
    );
    console.log('✅ Created new sparse unique index on firebaseUid');

    // Verify new indexes
    console.log('\nNew indexes on users collection:');
    const newIndexes = await usersCollection.indexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    console.log('\n✅ Index fix completed successfully!');
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixIndexes();
