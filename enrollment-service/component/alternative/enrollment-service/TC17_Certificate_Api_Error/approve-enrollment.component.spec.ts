import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('TC17 Approve Enrollment Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({ id: 'ENR017', employeeId: 'EMP017', courseId: 'COM001', status: 'PENDING_APPROVAL', approvedBy: null, approvedAt: null, rejectedBy: null, rejectedAt: null, certificateStatus: null, certificateUrl: null, createdAt: '2026-05-15T09:00:00Z', updatedAt: '2026-05-15T09:00:00Z' });
  });
  afterAll(async () => { await mongoRuntime.close(); });

  it('approves ENR017 with HR017 as setup flow of TC17', async () => {
    const courseRepository = createMockCourseRepository({ id: 'COM001', title: 'Computer with sir title', status: 'OPEN', seatLimit: 99, enrolledCount: 98 });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService: CertificateService = { async createCertificate() { throw new Error('not used'); } };
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).patch('/enrollments/ENR017/approve').send({ approvedBy: 'HR017' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ enrollmentId: 'ENR017', status: 'APPROVED', approvedBy: 'HR017' });
    const persisted = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR017' });
    expect(persisted).toMatchObject({ id: 'ENR017', status: 'APPROVED', approvedBy: 'HR017' });
  });
});
