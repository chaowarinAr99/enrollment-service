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

describe('TC02 Generate Certificate Success Component', () => {
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

  it('issues certificate for ENR002 and persists certificate state', async () => {
    const courseRepository = createMockCourseRepository({
      id: 'CHE001',
      title: 'Chemistry with sir title',
      status: 'OPEN',
      seatLimit: 99,
      enrolledCount: 1,
    });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService = createFakeCertificateService();
    stubCertificateSuccess(certificateService, {
      certificate_id: 'CERT002',
      certificate_url: 'https://certificate.example.com/CERT002.pdf',
      status: 'issued',
      issued_at: '2026-05-15T10:00:00Z',
    });

    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).post('/enrollments/ENR002/certificate').send({ progress: 100 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      enrollmentId: 'ENR002',
      certificateStatus: 'CERTIFICATE_ISSUED',
      certificate: {
        certificateId: 'CERT002',
        certificateUrl: 'https://certificate.example.com/CERT002.pdf',
        issuedAt: '2026-05-15T10:00:00Z',
      },
    });

    expectCertificateRequest(certificateService, {
      refId: 'ENR002',
      learnerId: 'EMP002',
      courseRef: 'CHE001',
    });

    const persisted = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR002' });
    expect(persisted).toMatchObject({
      id: 'ENR002',
      certificateStatus: 'CERTIFICATE_ISSUED',
      certificateUrl: 'https://certificate.example.com/CERT002.pdf',
    });
  });
});
