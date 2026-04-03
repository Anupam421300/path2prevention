require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    fs.writeFileSync('db_success.txt', 'Connected successfully to ' + mongoose.connection.host);
    return mongoose.connection.close();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    fs.writeFileSync('db_error.txt', 'Error: ' + err.message);
    process.exit(1);
  });
