import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import path from 'node:path';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { deleteCertificateImposter, loadCertificateImposter, startMountebank } from '../../../setup/mountebank-client.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import { HttpCertificateService } from '../../../../src/services/certificate.service.js';

describe('TC03 Generate Certificate Success Component', () => {
  let mongoRuntime: MongoTestRuntime;

  beforeAll(async () => {
    mongoRuntime = await createMongoTestRuntime();
    await startMountebank();
  });

  beforeEach(async () => {
    await mongoRuntime.reset();
    await deleteCertificateImposter();
    await loadCertificateImposter(path.join(process.cwd(), 'mountebank', 'imposters', 'certificate-service', 'success', 'tc03-generate-certificate-success.json'));
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
    await deleteCertificateImposter();
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
    const certificateService = new HttpCertificateService({ apiUrl: 'http://127.0.0.1:4545/certificates', timeoutMs: 300 });

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

    const persisted = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR003' });
    expect(persisted).toMatchObject({
      id: 'ENR003',
      certificateStatus: 'CERTIFICATE_ISSUED',
      certificateUrl: 'https://certificate.example.com/CERT003.pdf',
    });
  });
});
