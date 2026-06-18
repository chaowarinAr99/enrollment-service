import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ProgressNotCompletedError } from '../../../../src/errors/index.js';
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

  it('TC14 - generateCertificate failed by progress 0%', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR014',
      employeeId: 'EMP014',
      courseId: 'COM001',
      status: 'APPROVED',
    });

    const input = {
      enrollmentId: 'ENR014',
      progress: 0,
    };

    await expect(service.generateCertificate(input)).rejects.toThrow(
      ProgressNotCompletedError,
    );
    await expect(service.generateCertificate(input)).rejects.toThrow(
      'Progress must be 100%',
    );

    expect(enrollmentRepository.findById).toHaveBeenCalledWith('ENR014');
    expect(certificateService.createCertificate).not.toHaveBeenCalled();
    expect(enrollmentRepository.updateCertificateStatus).not.toHaveBeenCalled();
  });
});
