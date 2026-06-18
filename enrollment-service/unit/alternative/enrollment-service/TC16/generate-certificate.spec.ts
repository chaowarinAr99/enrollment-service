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

  it('TC16 - generateCertificate failed when enrollment status is rejected', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR016',
      employeeId: 'EMP016',
      courseId: 'PHY001',
      status: 'REJECTED',
    });

    await expect(
      service.generateCertificate({ enrollmentId: 'ENR016', progress: 100 }),
    ).rejects.toThrow(InvalidEnrollmentStatusError);
    await expect(
      service.generateCertificate({ enrollmentId: 'ENR016', progress: 100 }),
    ).rejects.toThrow('Enrollment is not approved');

    expect(enrollmentRepository.findById).toHaveBeenCalledWith('ENR016');
    expect(certificateService.createCertificate).not.toHaveBeenCalled();
  });
});
