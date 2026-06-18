import { MongoClient } from 'mongodb';

export type MongoRuntimeConfig = {
  uri: string;
  dbName: string;
  seedOnStart: boolean;
};

export function getMongoRuntimeConfig(
  environment: NodeJS.ProcessEnv = process.env,
): MongoRuntimeConfig {
  return {
    uri: environment.MONGO_URL ?? 'mongodb://127.0.0.1:27017',
    dbName: environment.MONGO_DB_NAME ?? 'enrollment_service',
    seedOnStart: environment.MONGO_SEED_ON_START !== 'false',
  };
}

export async function connectMongo(config = getMongoRuntimeConfig()) {
  const client = new MongoClient(config.uri);
  await client.connect();

  return {
    client,
    db: client.db(config.dbName),
    config,
  };
}
