import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('Approve Enrollment Component', () => {
  let mongoRuntime: MongoTestRuntime;

  beforeAll(async () => {
    mongoRuntime = await createMongoTestRuntime();
  });

  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR001',
      employeeId: 'EMP001',
      courseId: 'PHY001',
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

  it('approves enrollment and persists approved state in MongoDB', async () => {
    const courseRepository = createMockCourseRepository({
      id: 'PHY001',
      title: 'Physic with sir title',
      status: 'OPEN',
      seatLimit: 99,
      enrolledCount: 0,
    });
    const enrollmentRepository = new MongoEnrollmentRepository(
      mongoRuntime.enrollmentsCollection,
    );
    const certificateService: CertificateService = {
      async createCertificate() {
        throw new Error('Certificate service should not be called in this test');
      },
    };

    const app = createComponentApp({
      courseRepository,
      enrollmentRepository,
      certificateService,
    });

    const response = await request(app)
      .patch('/enrollments/ENR001/approve')
      .send({ approvedBy: 'HR001' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      enrollmentId: 'ENR001',
      status: 'APPROVED',
      approvedBy: 'HR001',
    });
    expect(response.body.approvedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);

    const persistedEnrollment = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR001' });

    expect(persistedEnrollment).toMatchObject({
      id: 'ENR001',
      status: 'APPROVED',
      approvedBy: 'HR001',
    });
    expect(persistedEnrollment?.approvedAt).toBe(response.body.approvedAt);
  });
});
