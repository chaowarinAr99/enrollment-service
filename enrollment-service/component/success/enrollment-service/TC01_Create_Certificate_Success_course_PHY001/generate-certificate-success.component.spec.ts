import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import {
  createFakeCertificateService,
  expectCertificateRequest,
  stubCertificateSuccess,
} from '../../../setup/fake-certificate-service.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';

describe('Generate Certificate Success Component', () => {
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

  it('issues certificate and persists certificate state in MongoDB', async () => {
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
    const certificateService = createFakeCertificateService();
    stubCertificateSuccess(certificateService, {
      certificate_id: 'CERT001',
      certificate_url: 'https://certificate.example.com/CERT001.pdf',
      status: 'issued',
      issued_at: '2026-05-15T10:00:00Z',
    });

    const app = createComponentApp({
      courseRepository,
      enrollmentRepository,
      certificateService,
    });

    const response = await request(app)
      .post('/enrollments/ENR001/certificate')
      .send({ progress: 100 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      enrollmentId: 'ENR001',
      certificateStatus: 'CERTIFICATE_ISSUED',
      certificate: {
        certificateId: 'CERT001',
        certificateUrl: 'https://certificate.example.com/CERT001.pdf',
        issuedAt: '2026-05-15T10:00:00Z',
      },
    });

    expectCertificateRequest(certificateService, {
      refId: 'ENR001',
      learnerId: 'EMP001',
      courseRef: 'PHY001',
    });

    const persistedEnrollment = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR001' });

    expect(persistedEnrollment).toMatchObject({
      id: 'ENR001',
      status: 'APPROVED',
      certificateStatus: 'CERTIFICATE_ISSUED',
      certificateUrl: 'https://certificate.example.com/CERT001.pdf',
    });
  });
});
