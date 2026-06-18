import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('Create Enrollment Duplicate Component', () => {
  let mongoRuntime: MongoTestRuntime;

  beforeAll(async () => {
    mongoRuntime = await createMongoTestRuntime();
  });

  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR009',
      employeeId: 'EMP009',
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

  it('returns 409 and keeps Mongo unchanged when active enrollment already exists', async () => {
    const courseRepository = createMockCourseRepository({
      id: 'PHY001',
      title: 'Physic with sir title',
      status: 'OPEN',
      seatLimit: 99,
      enrolledCount: 1,
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
      .post('/enrollments')
      .send({ employeeId: 'EMP009', courseId: 'PHY001' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Employee already enrolled' });

    const enrollmentCount = await mongoRuntime.enrollmentsCollection.countDocuments({
      employeeId: 'EMP009',
      courseId: 'PHY001',
    });

    expect(enrollmentCount).toBe(1);
  });
});
