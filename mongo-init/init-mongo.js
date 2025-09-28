// MongoDB initialization script
// This script creates the BCAN database and sets up initial collections

print('Starting MongoDB initialization...');

// Switch to the BCAN database
db = db.getSiblingDB('BCAN');

// Create the patients collection with a sample document (will be removed)
db.patients.insertOne({
  _temp: true,
  message: "This is a temporary document to initialize the collection"
});

// Remove the temporary document
db.patients.deleteOne({ _temp: true });

// Create indexes for better performance
db.patients.createIndex({ "patientId": 1 }, { unique: true });
db.patients.createIndex({ "createdAt": 1 });
db.patients.createIndex({ "Consultant.answered": 1 });
db.patients.createIndex({ "Radiologist.answered": 1 });

print('Database BCAN initialized successfully');
print('Created indexes on patients collection');
print('MongoDB initialization completed');