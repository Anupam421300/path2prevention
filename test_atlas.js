require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
console.log('URI begins with:', uri ? uri.substring(0, 30) + '...' : 'NOT SET');
console.log('URI type:', uri && uri.startsWith('mongodb+srv') ? 'Atlas SRV' : 'Local');

console.log('Testing connection to Atlas...');

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('SUCCESS: Connected to Atlas!');
    console.log('Host:', mongoose.connection.host);
    console.log('DB Name:', mongoose.connection.name);
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('Connection closed cleanly.');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nERROR (Connection Failed):');
    console.error(err.message);
    if (err.message.includes('bad auth')) {
      console.error('-> Hint: Check your username and password.');
    } else if (err.message.includes('querySrv ENOTFOUND')) {
      console.error('-> Hint: Check your cluster URL or DNS.');
    } else {
      console.error('-> Hint: Make sure your IP is completely whitelisted (0.0.0.0/0) in Atlas > Network Access.');
    }
    process.exit(1);
  });
