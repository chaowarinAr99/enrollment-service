import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { EnrollmentServiceImpl } from '../../../../src/services/enrollment.service.js';

describe('EnrollmentService.approveEnrollment', () => {
  const courseRepository = {
    findById: jest.fn(),
  };

  const enrollmentRepository = {
    findActiveByEmployeeAndCourse: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
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

  it('TC14 - Approve enrollment success with ENR014', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR014',
      employeeId: 'EMP014',
      courseId: 'COM001',
      status: 'PENDING_APPROVAL',
    });

    enrollmentRepository.approve.mockResolvedValue({
      enrollmentId: 'ENR014',
      status: 'APPROVED',
      approvedBy: 'HR001',
      approvedAt: '2026-05-15T10:00:00Z',
    });

    const result = await service.approveEnrollment({
      enrollmentId: 'ENR014',
      approvedBy: 'HR001',
    });

    expect(result).toEqual({
      enrollmentId: 'ENR014',
      status: 'APPROVED',
      approvedBy: 'HR001',
      approvedAt: '2026-05-15T10:00:00Z',
    });

    expect(enrollmentRepository.findById).toHaveBeenCalledWith('ENR014');
    expect(enrollmentRepository.approve).toHaveBeenCalledWith({
      enrollmentId: 'ENR014',
      approvedBy: 'HR001',
      approvedAt: expect.any(String),
    });
  });
});
