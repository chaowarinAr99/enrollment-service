import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('Create Enrollment Component', () => {
  let mongoRuntime: MongoTestRuntime;

  beforeAll(async () => {
    mongoRuntime = await createMongoTestRuntime();
  });

  beforeEach(async () => {
    await mongoRuntime.reset();
  });

  afterAll(async () => {
    await mongoRuntime.close();
  });

  it('creates enrollment and persists it in MongoDB', async () => {
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
      .post('/enrollments')
      .send({ employeeId: 'EMP001', courseId: 'PHY001' });

    expect(response.status).toBe(201);
    expect(response.body.enrollmentId).toMatch(/^ENR\d{3}$/);
    expect(response.body).toMatchObject({
      employeeId: 'EMP001',
      courseId: 'PHY001',
      status: 'PENDING_APPROVAL',
    });

    const persistedEnrollment = await mongoRuntime.enrollmentsCollection.findOne({
      id: response.body.enrollmentId,
    });

    expect(persistedEnrollment).toMatchObject({
      id: response.body.enrollmentId,
      employeeId: 'EMP001',
      courseId: 'PHY001',
      status: 'PENDING_APPROVAL',
      approvedBy: null,
      rejectedBy: null,
      certificateStatus: null,
      certificateUrl: null,
    });
  });
});
