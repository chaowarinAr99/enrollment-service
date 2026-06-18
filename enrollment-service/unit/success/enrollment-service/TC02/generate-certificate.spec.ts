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

  it('TC02 issues certificate for ENR002 when enrollment is approved and progress is 100', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR002',
      employeeId: 'EMP002',
      courseId: 'CHE001',
      status: 'APPROVED',
    });
    certificateService.createCertificate.mockResolvedValue({
      certificate_id: 'CERT002',
      certificate_url: 'https://cert.local/CERT002',
      status: 'issued',
      issued_at: '2026-05-15T10:00:00Z',
    });

    await expect(
      service.generateCertificate({ enrollmentId: 'ENR002', progress: 100 }),
    ).resolves.toEqual({
      enrollmentId: 'ENR002',
      certificateStatus: 'CERTIFICATE_ISSUED',
      certificate: {
        certificateId: 'CERT002',
        certificateUrl: 'https://cert.local/CERT002',
        issuedAt: '2026-05-15T10:00:00Z',
      },
    });
  });
});
