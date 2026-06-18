import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('Approve Enrollment Invalid Status Component', () => {
  let mongoRuntime: MongoTestRuntime;

  beforeAll(async () => {
    mongoRuntime = await createMongoTestRuntime();
  });

  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR016',
      employeeId: 'EMP016',
      courseId: 'PHY001',
      status: 'REJECTED',
      approvedBy: null,
      approvedAt: null,
      rejectedBy: 'HR003',
      rejectedAt: '2026-05-15T10:00:00Z',
      certificateStatus: null,
      certificateUrl: null,
      createdAt: '2026-05-15T09:00:00Z',
      updatedAt: '2026-05-15T10:00:00Z',
    });
  });

  afterAll(async () => {
    await mongoRuntime.close();
  });

  it('returns 409 and keeps rejected enrollment unchanged', async () => {
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
      .patch('/enrollments/ENR016/approve')
      .send({ approvedBy: 'HR001' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Enrollment cannot be approved' });

    const persistedEnrollment = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR016' });

    expect(persistedEnrollment).toMatchObject({
      id: 'ENR016',
      status: 'REJECTED',
      rejectedBy: 'HR003',
    });
  });
});
