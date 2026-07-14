import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createFakeCertificateService } from '../../../setup/fake-certificate-service.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';

describe('TC14 Generate Certificate Progress 0 Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR014', employeeId: 'EMP014', courseId: 'COM001', status: 'APPROVED', approvedBy: 'HR001', approvedAt: '2026-05-15T10:00:00Z', rejectedBy: null, rejectedAt: null, certificateStatus: null, certificateUrl: null, createdAt: '2026-05-15T09:00:00Z', updatedAt: '2026-05-15T10:00:00Z',
    });
  });
  afterAll(async () => { await mongoRuntime.close(); });

  it('returns 409 when progress is 0 and keeps certificate fields null', async () => {
    const courseRepository = createMockCourseRepository({ id: 'COM001', title: 'Computer with sir title', status: 'OPEN', seatLimit: 99, enrolledCount: 98 });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService = createFakeCertificateService();
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).post('/enrollments/ENR014/certificate').send({ progress: 0 });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Progress must be 100%' });
    expect(certificateService.createCertificate).not.toHaveBeenCalled();
    const persisted = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR014' });
    expect(persisted).toMatchObject({ id: 'ENR014', certificateStatus: null, certificateUrl: null });
  });
});
