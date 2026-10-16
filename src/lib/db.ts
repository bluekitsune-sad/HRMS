import mongoose from "mongoose";

/**
 * Global mongoose connection cache.
 * Avoids opening a new connection on every hot-reload / serverless invocation.
 */

const MONGODB_URI = process.env.MONGODB_URI ?? "";

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = global as typeof globalThis & { __mongoose?: Cached };
const cached: Cached = globalWithMongoose.__mongoose ?? { conn: null, promise: null };
globalWithMongoose.__mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error(
      "Missing MONGODB_URI. Add it to .env.local (see .env.example)."
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on next request
    throw err;
  }

  return cached.conn;
}
