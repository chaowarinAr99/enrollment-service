import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('TC04 Create EmployeeId Required Component', () => {
  let mongoRuntime: MongoTestRuntime;

  beforeAll(async () => {
    mongoRuntime = await createMongoTestRuntime();
  });
  beforeEach(async () => {
    await mongoRuntime.reset();
  });
  afterAll(async () => {
    await mongoRuntime.close();
  });

  it('returns 400 when employeeId is missing', async () => {
    const courseRepository = createMockCourseRepository({
      id: 'COM001',
      title: 'Computer with sir title',
      status: 'OPEN',
      seatLimit: 99,
      enrolledCount: 98,
    });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService: CertificateService = { async createCertificate() { throw new Error('not used'); } };
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });

    const response = await request(app).post('/enrollments').send({ employeeId: null, courseId: 'COM001' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'employeeId is required' });
    expect(await mongoRuntime.enrollmentsCollection.countDocuments()).toBe(0);
  });
});
