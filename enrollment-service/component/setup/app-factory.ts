import express, { type Express } from 'express';

import { EnrollmentController } from '../../src/controllers/enrollment.controller.js';
import { errorHandler } from '../../src/middleware/error-handler.js';
import type { CourseRepository } from '../../src/repositories/course.repository.js';
import type { EnrollmentRepository } from '../../src/repositories/enrollment.repository.js';
import { registerEnrollmentRoutes } from '../../src/routes/enrollment.routes.js';
import type { CertificateService } from '../../src/services/certificate.service.js';
import { EnrollmentServiceImpl } from '../../src/services/enrollment.service.js';

export type ComponentAppDependencies = {
  courseRepository: CourseRepository;
  enrollmentRepository: EnrollmentRepository;
  certificateService: CertificateService;
};

export function createComponentApp(
  dependencies: ComponentAppDependencies,
): Express {
  const enrollmentService = new EnrollmentServiceImpl(
    dependencies.courseRepository,
    dependencies.enrollmentRepository,
    dependencies.certificateService,
  );
  const controller = new EnrollmentController(enrollmentService);

  const app = express();
  app.use(express.json());
  registerEnrollmentRoutes(app, controller, errorHandler);

  return app;
}

export function createMockCourseRepository(course: {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED';
  seatLimit: number;
  enrolledCount: number;
} | null): CourseRepository {
  return {
    async findById() {
      return course;
    },
  };
}
