import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { EnrollmentServiceImpl } from '../../../../src/services/enrollment.service.js';

describe('EnrollmentService.generateCertificate', () => {
  const courseRepository = { findById: jest.fn() };
  const enrollmentRepository = {
    findActiveByEmployeeAndCourse: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    updateCertificateStatus: jest.fn(),
  };
  const certificateService = { createCertificate: jest.fn() };
  let service: EnrollmentServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EnrollmentServiceImpl(
      courseRepository as never,
      enrollmentRepository as never,
      certificateService as never,
    );
  });

  it('TC03 issues certificate for ENR003 when enrollment is approved and progress is 100', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR003',
      employeeId: 'EMP003',
      courseId: 'COM001',
      status: 'APPROVED',
    });
    certificateService.createCertificate.mockResolvedValue({
      certificate_id: 'CERT003',
      certificate_url: 'https://cert.local/CERT003',
      status: 'issued',
      issued_at: '2026-05-15T10:00:00Z',
    });

    await expect(
      service.generateCertificate({ enrollmentId: 'ENR003', progress: 100 }),
    ).resolves.toEqual({
      enrollmentId: 'ENR003',
      certificateStatus: 'CERTIFICATE_ISSUED',
      certificate: {
        certificateId: 'CERT003',
        certificateUrl: 'https://cert.local/CERT003',
        issuedAt: '2026-05-15T10:00:00Z',
      },
    });
  });
});
