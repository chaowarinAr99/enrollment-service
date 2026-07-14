import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createFakeCertificateService } from '../../../setup/fake-certificate-service.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';

describe('Generate Certificate Progress Not Complete Component', () => {
  let mongoRuntime: MongoTestRuntime;

  beforeAll(async () => {
    mongoRuntime = await createMongoTestRuntime();
  });

  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR013',
      employeeId: 'EMP013',
      courseId: 'CHE001',
      status: 'APPROVED',
      approvedBy: 'HR013',
      approvedAt: '2026-05-15T10:00:00Z',
      rejectedBy: null,
      rejectedAt: null,
      certificateStatus: null,
      certificateUrl: null,
      createdAt: '2026-05-15T09:00:00Z',
      updatedAt: '2026-05-15T10:00:00Z',
    });
  });

  afterAll(async () => {
    await mongoRuntime.close();
  });

  it('returns 409 without changing certificate fields when progress is below 100', async () => {
    const courseRepository = createMockCourseRepository({
      id: 'CHE001',
      title: 'Chemistry with sir title',
      status: 'OPEN',
      seatLimit: 99,
      enrolledCount: 1,
    });
    const enrollmentRepository = new MongoEnrollmentRepository(
      mongoRuntime.enrollmentsCollection,
    );
    const certificateService = createFakeCertificateService();

    const app = createComponentApp({
      courseRepository,
      enrollmentRepository,
      certificateService,
    });

    const response = await request(app)
      .post('/enrollments/ENR013/certificate')
      .send({ progress: 99 });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Progress must be 100%' });
    expect(certificateService.createCertificate).not.toHaveBeenCalled();

    const persistedEnrollment = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR013' });

    expect(persistedEnrollment).toMatchObject({
      id: 'ENR013',
      employeeId: 'EMP013',
      courseId: 'CHE001',
      approvedBy: 'HR013',
      certificateStatus: null,
      certificateUrl: null,
    });
  });
});
