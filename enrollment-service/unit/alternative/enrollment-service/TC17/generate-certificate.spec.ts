import { beforeEach, describe, expect, it, jest } from '@jest/globals';

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

  it('TC17 - generateCertificate failed by API Server Down', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR017',
      employeeId: 'EMP017',
      courseId: 'COM001',
      status: 'APPROVED',
    });

    certificateService.createCertificate.mockRejectedValue(
      new Error('API Server Down'),
    );

    enrollmentRepository.updateCertificateStatus.mockResolvedValue(undefined);

    await expect(
      service.generateCertificate({ enrollmentId: 'ENR017', progress: 100 }),
    ).rejects.toThrow('API Server Down');

    expect(enrollmentRepository.findById).toHaveBeenCalledWith('ENR017');
    expect(certificateService.createCertificate).toHaveBeenCalledWith({
      refId: 'ENR017',
      learnerId: 'EMP017',
      courseRef: 'COM001',
    });
    expect(enrollmentRepository.updateCertificateStatus).toHaveBeenCalledWith({
      enrollmentId: 'ENR017',
      certificateStatus: 'CERTIFICATE_FAILED',
    });
  });
});
