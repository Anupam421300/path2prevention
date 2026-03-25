'use strict';
const mongoose = require('mongoose');

let cached = global.mongooseCache;
if (!cached) cached = global.mongooseCache = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI environment variable not set');

    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    }).then((m) => {
      console.log('MongoDB connected');
      return m;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connectDB };
