import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { InvalidEnrollmentStatusError } from '../../../../src/errors/index.js';
import { EnrollmentServiceImpl } from '../../../../src/services/enrollment.service.js';

describe('EnrollmentService.generateCertificate', () => {
  const courseRepository = {
    findById: jest.fn(),
  };

  const enrollmentRepository = {
    findActiveByEmployeeAndCourse: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    updateCertificateStatus: jest.fn(),
  };

  const certificateService = {
    createCertificate: jest.fn(),
  };

  let service: EnrollmentServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EnrollmentServiceImpl(
      courseRepository as never,
      enrollmentRepository as never,
      certificateService as never,
    );
  });

  it('TC15 - generateCertificate failed when enrollment status is pending approve', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR015',
      employeeId: 'EMP015',
      courseId: 'PHY001',
      status: 'PENDING_APPROVAL',
    });

    await expect(
      service.generateCertificate({ enrollmentId: 'ENR015', progress: 100 }),
    ).rejects.toThrow(InvalidEnrollmentStatusError);
    await expect(
      service.generateCertificate({ enrollmentId: 'ENR015', progress: 100 }),
    ).rejects.toThrow('Enrollment is not approved');

    expect(enrollmentRepository.findById).toHaveBeenCalledWith('ENR015');
    expect(certificateService.createCertificate).not.toHaveBeenCalled();
  });
});
