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

  it('TC17 - Approve enrollment success with ENR017', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR017',
      employeeId: 'EMP017',
      courseId: 'COM001',
      status: 'PENDING_APPROVAL',
    });

    enrollmentRepository.approve.mockResolvedValue({
      enrollmentId: 'ENR017',
      status: 'APPROVED',
      approvedBy: 'HR001',
      approvedAt: '2026-05-15T10:00:00Z',
    });

    const result = await service.approveEnrollment({
      enrollmentId: 'ENR017',
      approvedBy: 'HR001',
    });

    expect(result).toEqual({
      enrollmentId: 'ENR017',
      status: 'APPROVED',
      approvedBy: 'HR001',
      approvedAt: '2026-05-15T10:00:00Z',
    });

    expect(enrollmentRepository.findById).toHaveBeenCalledWith('ENR017');
    expect(enrollmentRepository.approve).toHaveBeenCalledWith({
      enrollmentId: 'ENR017',
      approvedBy: 'HR001',
      approvedAt: expect.any(String),
    });
  });
});
