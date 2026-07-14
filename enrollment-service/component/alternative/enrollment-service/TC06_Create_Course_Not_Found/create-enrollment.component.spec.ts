import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('TC06 Create Course Not Found Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => { await mongoRuntime.reset(); });
  afterAll(async () => { await mongoRuntime.close(); });

  it('returns 404 when course does not exist', async () => {
    const courseRepository = createMockCourseRepository(null);
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService: CertificateService = { async createCertificate() { throw new Error('not used'); } };
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).post('/enrollments').send({ employeeId: 'EMP006', courseId: 'BIG001' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Course not found' });
    expect(await mongoRuntime.enrollmentsCollection.countDocuments()).toBe(0);
  });
});
