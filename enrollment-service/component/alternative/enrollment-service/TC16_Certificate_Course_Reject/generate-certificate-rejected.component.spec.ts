import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import { HttpCertificateService } from '../../../../src/services/certificate.service.js';

describe('TC16 Generate Certificate Rejected Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR016', employeeId: 'EMP016', courseId: 'PHY001', status: 'REJECTED', approvedBy: null, approvedAt: null, rejectedBy: 'HR003', rejectedAt: '2026-05-15T10:00:00Z', certificateStatus: null, certificateUrl: null, createdAt: '2026-05-15T09:00:00Z', updatedAt: '2026-05-15T10:00:00Z',
    });
  });
  afterAll(async () => { await mongoRuntime.close(); });

  it('returns 409 when enrollment is rejected', async () => {
    const courseRepository = createMockCourseRepository({ id: 'PHY001', title: 'Physic with sir title', status: 'OPEN', seatLimit: 99, enrolledCount: 0 });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService = new HttpCertificateService({ apiUrl: 'http://127.0.0.1:4545/certificates', timeoutMs: 300 });
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).post('/enrollments/ENR016/certificate').send({ progress: 100 });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Enrollment is not approved' });
  });
});
