import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createFakeCertificateService } from '../../../setup/fake-certificate-service.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';

describe('TC15 Generate Certificate Not Approved Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR015', employeeId: 'EMP015', courseId: 'PHY001', status: 'PENDING_APPROVAL', approvedBy: null, approvedAt: null, rejectedBy: null, rejectedAt: null, certificateStatus: null, certificateUrl: null, createdAt: '2026-05-15T09:00:00Z', updatedAt: '2026-05-15T09:00:00Z',
    });
  });
  afterAll(async () => { await mongoRuntime.close(); });

  it('returns 409 when enrollment is not approved', async () => {
    const courseRepository = createMockCourseRepository({ id: 'PHY001', title: 'Physic with sir title', status: 'OPEN', seatLimit: 99, enrolledCount: 0 });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService = createFakeCertificateService();
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).post('/enrollments/ENR015/certificate').send({ progress: 100 });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Enrollment is not approved' });
    expect(certificateService.createCertificate).not.toHaveBeenCalled();

    const persisted = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR015' });
    expect(persisted).toMatchObject({
      id: 'ENR015',
      status: 'PENDING_APPROVAL',
      certificateStatus: null,
      certificateUrl: null,
    });
  });
});
