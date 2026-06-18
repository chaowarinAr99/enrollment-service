import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('TC03 Get Enrollment After Certificate Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => {
    await mongoRuntime.reset();
    await mongoRuntime.enrollmentsCollection.insertOne({
      id: 'ENR003', employeeId: 'EMP003', courseId: 'COM001', status: 'APPROVED', approvedBy: 'HR001', approvedAt: '2026-05-15T10:00:00Z', rejectedBy: null, rejectedAt: null, certificateStatus: 'CERTIFICATE_ISSUED', certificateUrl: 'https://certificate.example.com/CERT003.pdf', createdAt: '2026-05-15T09:00:00Z', updatedAt: '2026-05-15T10:00:00Z',
    });
  });
  afterAll(async () => { await mongoRuntime.close(); });

  it('returns certificate-issued state for ENR003', async () => {
    const courseRepository = createMockCourseRepository({ id: 'COM001', title: 'Computer with sir title', status: 'OPEN', seatLimit: 99, enrolledCount: 98 });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService: CertificateService = { async createCertificate() { throw new Error('not used'); } };
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).get('/enrollments/ENR003');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 'ENR003',
      employeeId: 'EMP003',
      courseId: 'COM001',
      status: 'APPROVED',
      approvedBy: 'HR001',
      approvedAt: '2026-05-15T10:00:00Z',
      rejectedBy: null,
      rejectedAt: null,
      certificateStatus: 'CERTIFICATE_ISSUED',
      certificateUrl: 'https://certificate.example.com/CERT003.pdf',
      createdAt: '2026-05-15T09:00:00Z',
      updatedAt: '2026-05-15T10:00:00Z',
    });
  });
});
