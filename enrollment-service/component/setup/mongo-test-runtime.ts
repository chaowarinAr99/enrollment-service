import type { Collection, Db, MongoClient } from 'mongodb';

import type { Enrollment } from '../../src/models/enrollment.js';
import { connectMongo } from '../../src/runtime/mongo.js';

export type MongoTestRuntime = {
  client: MongoClient;
  db: Db;
  enrollmentsCollection: Collection<Enrollment>;
  reset(): Promise<void>;
  close(): Promise<void>;
};

export async function createMongoTestRuntime(): Promise<MongoTestRuntime> {
  const connection = await connectMongo({
    uri: process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017',
    dbName: process.env.MONGO_COMPONENT_DB_NAME ?? 'enrollment_service_component_test',
    seedOnStart: false,
  });

  const enrollmentsCollection = connection.db.collection<Enrollment>('enrollments');

  return {
    client: connection.client,
    db: connection.db,
    enrollmentsCollection,
    async reset() {
      await connection.db.dropDatabase();
    },
    async close() {
      await connection.client.close();
    },
  };
}
