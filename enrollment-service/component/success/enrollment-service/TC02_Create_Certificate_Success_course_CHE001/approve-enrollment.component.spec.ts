import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('TC02 Approve Enrollment Component', () => {
  let mongoRuntime: MongoTestRuntime;

  beforeAll(async () => {
    mongoRuntime = await createMongoTestRuntime();
  });

  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR002',
      employeeId: 'EMP002',
      courseId: 'CHE001',
      status: 'PENDING_APPROVAL',
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      certificateStatus: null,
      certificateUrl: null,
      createdAt: '2026-05-15T09:00:00Z',
      updatedAt: '2026-05-15T09:00:00Z',
    });
  });

  afterAll(async () => {
    await mongoRuntime.close();
  });

  it('approves ENR002 and persists approved state', async () => {
    const courseRepository = createMockCourseRepository({
      id: 'CHE001',
      title: 'Chemistry with sir title',
      status: 'OPEN',
      seatLimit: 99,
      enrolledCount: 1,
    });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService: CertificateService = {
      async createCertificate() {
        throw new Error('Certificate service should not be called in this test');
      },
    };

    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });

    const response = await request(app)
      .patch('/enrollments/ENR002/approve')
      .send({ approvedBy: 'HR001' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      enrollmentId: 'ENR002',
      status: 'APPROVED',
      approvedBy: 'HR001',
    });

    const persisted = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR002' });
    expect(persisted).toMatchObject({
      id: 'ENR002',
      status: 'APPROVED',
      approvedBy: 'HR001',
    });
  });
});
