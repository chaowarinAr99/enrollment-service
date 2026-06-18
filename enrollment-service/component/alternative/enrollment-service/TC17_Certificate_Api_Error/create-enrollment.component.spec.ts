import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('TC17 Create Enrollment Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => { await mongoRuntime.reset(); });
  afterAll(async () => { await mongoRuntime.close(); });

  it('creates ENR017 for COM001 as setup flow of TC17', async () => {
    const courseRepository = createMockCourseRepository({ id: 'COM001', title: 'Computer with sir title', status: 'OPEN', seatLimit: 99, enrolledCount: 98 });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService: CertificateService = { async createCertificate() { throw new Error('not used'); } };
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).post('/enrollments').send({ employeeId: 'EMP017', courseId: 'COM001' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ enrollmentId: 'ENR001', employeeId: 'EMP017', courseId: 'COM001', status: 'PENDING_APPROVAL' });
  });
});
