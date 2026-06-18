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
  it('TC13-generateCertificate failed by progress 99%', async () => {
    const input = {
      enrollmentId: 'ENR013',
      progress: 99,
    };

    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR013',
      employeeId: 'EMP013',
      courseId: 'CHE001',
      status: 'APPROVED',
    });

    await expect(service.generateCertificate(input)).rejects.toThrow(
      ProgressNotCompletedError,
    );
    await expect(service.generateCertificate(input)).rejects.toThrow(
      'Progress must be 100%',
    );

    expect(enrollmentRepository.findById).toHaveBeenCalledWith('ENR013');
    expect(certificateService.createCertificate).not.toHaveBeenCalled();
  });
});
