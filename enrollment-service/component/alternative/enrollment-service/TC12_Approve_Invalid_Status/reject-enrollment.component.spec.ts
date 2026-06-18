import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('TC12 Reject Enrollment Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({ id: 'ENR012', employeeId: 'EMP012', courseId: 'PHY001', status: 'PENDING_APPROVAL', approvedBy: null, approvedAt: null, rejectedBy: null, rejectedAt: null, certificateStatus: null, certificateUrl: null, createdAt: '2026-05-15T09:00:00Z', updatedAt: '2026-05-15T09:00:00Z' });
  });
  afterAll(async () => { await mongoRuntime.close(); });

  it('rejects ENR012 and persists rejected state', async () => {
    const courseRepository = createMockCourseRepository({ id: 'PHY001', title: 'Physic with sir title', status: 'OPEN', seatLimit: 99, enrolledCount: 0 });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService: CertificateService = { async createCertificate() { throw new Error('not used'); } };
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).patch('/enrollments/ENR012/reject').send({ rejectedBy: 'HR003' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ enrollmentId: 'ENR012', status: 'REJECTED', rejectedBy: 'HR003' });
    const persisted = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR012' });
    expect(persisted).toMatchObject({ id: 'ENR012', status: 'REJECTED', rejectedBy: 'HR003' });
  });
});
