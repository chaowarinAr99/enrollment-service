import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('TC08 Create Course Full Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => { await mongoRuntime.reset(); });
  afterAll(async () => { await mongoRuntime.close(); });

  it('returns 409 when course is full', async () => {
    const courseRepository = createMockCourseRepository({ id: 'BIO001', title: 'Biology with sir title', status: 'OPEN', seatLimit: 99, enrolledCount: 99 });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService: CertificateService = { async createCertificate() { throw new Error('not used'); } };
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).post('/enrollments').send({ employeeId: 'EMP008', courseId: 'BIO001' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Course is full' });
  });
});
