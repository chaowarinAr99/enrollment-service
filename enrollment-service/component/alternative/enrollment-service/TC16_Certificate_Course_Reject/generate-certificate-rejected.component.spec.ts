import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createFakeCertificateService } from '../../../setup/fake-certificate-service.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';

describe('TC16 Generate Certificate Rejected Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR016', employeeId: 'EMP016', courseId: 'CHE001', status: 'REJECTED', approvedBy: null, approvedAt: null, rejectedBy: 'HR003', rejectedAt: '2026-05-15T10:00:00Z', certificateStatus: null, certificateUrl: null, createdAt: '2026-05-15T09:00:00Z', updatedAt: '2026-05-15T10:00:00Z',
    });
  });
  afterAll(async () => { await mongoRuntime.close(); });

  it('returns 409 when enrollment is rejected', async () => {
    const courseRepository = createMockCourseRepository({ id: 'CHE001', title: 'Chemistry with sir title', status: 'OPEN', seatLimit: 99, enrolledCount: 1 });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService = createFakeCertificateService();
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).post('/enrollments/ENR016/certificate').send({ progress: 0 });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Enrollment is not approved' });
    expect(certificateService.createCertificate).not.toHaveBeenCalled();

    const persisted = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR016' });
    expect(persisted).toMatchObject({
      id: 'ENR016',
      employeeId: 'EMP016',
      courseId: 'CHE001',
      status: 'REJECTED',
      rejectedBy: 'HR003',
      certificateStatus: null,
      certificateUrl: null,
    });
  });
});
