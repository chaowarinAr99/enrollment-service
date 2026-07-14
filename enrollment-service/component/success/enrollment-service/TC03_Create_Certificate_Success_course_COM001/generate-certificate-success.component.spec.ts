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

describe('TC03 Generate Certificate Success Component', () => {
  let mongoRuntime: MongoTestRuntime;

  beforeAll(async () => {
    mongoRuntime = await createMongoTestRuntime();
  });

  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR003',
      employeeId: 'EMP003',
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

  it('issues certificate for ENR003 and persists certificate state', async () => {
    const courseRepository = createMockCourseRepository({
      id: 'COM001',
      title: 'Computer with sir title',
      status: 'OPEN',
      seatLimit: 99,
      enrolledCount: 98,
    });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService = createFakeCertificateService();
    stubCertificateSuccess(certificateService, {
      certificate_id: 'CERT003',
      certificate_url: 'https://certificate.example.com/CERT003.pdf',
      status: 'issued',
      issued_at: '2026-05-15T10:00:00Z',
    });

    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).post('/enrollments/ENR003/certificate').send({ progress: 100 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      enrollmentId: 'ENR003',
      certificateStatus: 'CERTIFICATE_ISSUED',
      certificate: {
        certificateId: 'CERT003',
        certificateUrl: 'https://certificate.example.com/CERT003.pdf',
        issuedAt: '2026-05-15T10:00:00Z',
      },
    });

    expectCertificateRequest(certificateService, {
      refId: 'ENR003',
      learnerId: 'EMP003',
      courseRef: 'COM001',
    });

    const persisted = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR003' });
    expect(persisted).toMatchObject({
      id: 'ENR003',
      certificateStatus: 'CERTIFICATE_ISSUED',
      certificateUrl: 'https://certificate.example.com/CERT003.pdf',
    });
  });
});
