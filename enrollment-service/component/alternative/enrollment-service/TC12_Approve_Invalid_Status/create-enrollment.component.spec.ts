import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createComponentApp, createMockCourseRepository } from '../../../setup/app-factory.js';
import { createMongoTestRuntime, type MongoTestRuntime } from '../../../setup/mongo-test-runtime.js';
import { MongoEnrollmentRepository } from '../../../../src/repositories/mongo-repositories.js';
import type { CertificateService } from '../../../../src/services/certificate.service.js';

describe('TC12 Create Enrollment Component', () => {
  let mongoRuntime: MongoTestRuntime;
  beforeAll(async () => { mongoRuntime = await createMongoTestRuntime(); });
  beforeEach(async () => { await mongoRuntime.reset(); });
  afterAll(async () => { await mongoRuntime.close(); });

  it('creates ENR012 for PHY001 as setup flow of TC12', async () => {
    const courseRepository = createMockCourseRepository({ id: 'PHY001', title: 'Physic with sir title', status: 'OPEN', seatLimit: 99, enrolledCount: 0 });
    const enrollmentRepository = new MongoEnrollmentRepository(mongoRuntime.enrollmentsCollection);
    const certificateService: CertificateService = { async createCertificate() { throw new Error('not used'); } };
    const app = createComponentApp({ courseRepository, enrollmentRepository, certificateService });
    const response = await request(app).post('/enrollments').send({ employeeId: 'EMP012', courseId: 'PHY001' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ enrollmentId: 'ENR001', employeeId: 'EMP012', courseId: 'PHY001', status: 'PENDING_APPROVAL' });

    const persisted = await mongoRuntime.enrollmentsCollection.findOne({ id: 'ENR001' });
    expect(persisted).toMatchObject({
      id: 'ENR001',
      employeeId: 'EMP012',
      courseId: 'PHY001',
      status: 'PENDING_APPROVAL',
      certificateStatus: null,
      certificateUrl: null,
    });
  });
});
