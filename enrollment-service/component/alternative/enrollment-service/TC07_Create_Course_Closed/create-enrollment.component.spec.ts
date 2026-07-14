import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('TC07 Create Course Closed Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => { await mongoRuntime.reset(); });
  afterAll(async () => { await mongoRuntime.close(); });

  it('returns 409 when course is closed', async () => {
    const courseRepository = createMockCourseRepository({ id: 'MTH001', title: 'Math with sir title', status: 'CLOSED', seatLimit: 99, enrolledCount: 0 });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService: CertificateService = { async createCertificate() { throw new Error('not used'); } };
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).post('/enrollments').send({ employeeId: 'EMP007', courseId: 'MTH001' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Course is not open for enrollment' });
    expect(await mongoRuntime.enrollmentsCollection.countDocuments()).toBe(0);
  });
});
