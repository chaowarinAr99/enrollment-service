import express from 'express';

import { EnrollmentController } from './controllers/enrollment.controller.js';
import { errorHandler } from './middleware/error-handler.js';
import {
  MongoCourseRepository,
  MongoEnrollmentRepository,
} from './repositories/mongo-repositories.js';
import { registerEnrollmentRoutes } from './routes/enrollment.routes.js';
import { connectMongo } from './runtime/mongo.js';
import { seedMongoCollections } from './runtime/mongo-seed.js';
import { HttpCertificateService } from './services/certificate.service.js';
import { EnrollmentServiceImpl } from './services/enrollment.service.js';

const port = Number(process.env.PORT ?? 3000);

async function main() {
  const mongo = await connectMongo();
  const coursesCollection = mongo.db.collection('courses');
  const enrollmentsCollection = mongo.db.collection('enrollments');

  if (mongo.config.seedOnStart) {
    await seedMongoCollections({
      coursesCollection,
      enrollmentsCollection,
    });
  }

  const courseRepository = new MongoCourseRepository(coursesCollection);
  const enrollmentRepository = new MongoEnrollmentRepository(enrollmentsCollection);
  const certificateService = new HttpCertificateService();
  const enrollmentService = new EnrollmentServiceImpl(
    courseRepository,
    enrollmentRepository,
    certificateService,
  );
  const controller = new EnrollmentController(enrollmentService);

  const app = express();

  app.use(express.json());
  app.get('/health', async (_request, response) => {
    try {
      await mongo.db.command({ ping: 1 });
      response.status(200).json({
        status: 'ok',
        service: 'enrollment-service',
        mongo: 'ok',
      });
    } catch (error) {
      response.status(503).json({
        status: 'error',
        service: 'enrollment-service',
        mongo: 'unavailable',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  registerEnrollmentRoutes(app, controller, errorHandler);

  const server = app.listen(port, () => {
    const certificateApiUrl =
      process.env.CERTIFICATE_API_URL ?? 'http://localhost:4545/certificates';
    console.log(`enrollment-service listening on http://localhost:${port}`);
    console.log(`certificate API URL: ${certificateApiUrl}`);
    console.log(`mongo database: ${mongo.config.dbName}`);
  });

  const shutdown = async () => {
    server.close();
    await mongo.client.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start enrollment-service', error);
  process.exit(1);
});
