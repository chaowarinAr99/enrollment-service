import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import {
  createFakeCertificateService,
  expectCertificateRequest,
  stubCertificateTimeout,
} from '../../../setup/fake-certificate-service.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';

describe('Generate Certificate Timeout Component', () => {
  let mongoRuntime: MongoTestRuntime;

  beforeAll(async () => {
    mongoRuntime = await createMongoTestRuntime();
  });

  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR018',
      employeeId: 'EMP018',
      courseId: 'COM001',
      status: 'APPROVED',
      approvedBy: 'HR001',
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

  it('returns 504 and persists CERTIFICATE_FAILED when certificate API times out', async () => {
    const courseRepository = createMockCourseRepository({
      id: 'COM001',
      title: 'Computer with sir title',
      status: 'OPEN',
      seatLimit: 99,
      enrolledCount: 0,
    });
    const enrollmentRepository = new MongoEnrollmentRepository(
      mongoRuntime.enrollmentsCollection,
    );
    const certificateService = createFakeCertificateService();
    stubCertificateTimeout(certificateService);

    const app = createComponentApp({
      courseRepository,
      enrollmentRepository,
      certificateService,
    });

    const response = await request(app)
      .post('/enrollments/ENR018/certificate')
      .send({ progress: 100 });

    expect(response.status).toBe(504);
    expect(response.body).toEqual({
      message: 'Certificate API timeout',
      code: 'CERTIFICATE_API_TIMEOUT',
    });

    expectCertificateRequest(certificateService, {
      refId: 'ENR018',
      learnerId: 'EMP018',
      courseRef: 'COM001',
    });

    const persistedEnrollment = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR018' });

    expect(persistedEnrollment).toMatchObject({
      id: 'ENR018',
      certificateStatus: 'CERTIFICATE_FAILED',
      certificateUrl: null,
    });
  });
});
