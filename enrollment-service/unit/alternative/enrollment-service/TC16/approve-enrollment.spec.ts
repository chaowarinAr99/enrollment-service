import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { EnrollmentServiceImpl } from '../../../../src/services/enrollment.service.js';

describe('EnrollmentService.rejectEnrollment', () => {
  const courseRepository = {
    findById: jest.fn(),
  };

  const enrollmentRepository = {
    findActiveByEmployeeAndCourse: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    reject: jest.fn(),
    approve: jest.fn(),
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

  it('TC16 rejects ENR016 for CHE001', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR016',
      employeeId: 'EMP016',
      courseId: 'CHE001',
      status: 'PENDING_APPROVAL',
    });

    enrollmentRepository.reject.mockResolvedValue({
      enrollmentId: 'ENR016',
      status: 'REJECTED',
      rejectedBy: 'HR003',
      rejectedAt: '2026-05-15T10:00:00Z',
    });

    const result = await service.rejectEnrollment({
      enrollmentId: 'ENR016',
      rejectedBy: 'HR003',
    });

    expect(result).toEqual({
      enrollmentId: 'ENR016',
      status: 'REJECTED',
      rejectedBy: 'HR003',
      rejectedAt: '2026-05-15T10:00:00Z',
    });

    expect(enrollmentRepository.findById).toHaveBeenCalledWith('ENR016');
    expect(enrollmentRepository.reject).toHaveBeenCalledWith({
      enrollmentId: 'ENR016',
      rejectedBy: 'HR003',
      rejectedAt: expect.any(String),
    });
  });
});
