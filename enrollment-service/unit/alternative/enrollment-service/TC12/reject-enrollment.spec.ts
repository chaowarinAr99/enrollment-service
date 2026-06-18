import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { EnrollmentServiceImpl } from '../../../../src/services/enrollment.service.js';

describe('EnrollmentService.rejectEnrollment', () => {
  const courseRepository = { findById: jest.fn() };
  const enrollmentRepository = {
    findActiveByEmployeeAndCourse: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
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

  it('TC12 rejects ENR012 when status is PENDING_APPROVAL', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR012',
      employeeId: 'EMP012',
      courseId: 'CHE001',
      status: 'PENDING_APPROVAL',
    });
    enrollmentRepository.reject.mockResolvedValue({
      enrollmentId: 'ENR012',
      status: 'REJECTED',
      rejectedBy: 'HR003',
      rejectedAt: '2026-05-15T10:00:00Z',
    });

    await expect(
      service.rejectEnrollment({ enrollmentId: 'ENR012', rejectedBy: 'HR003' }),
    ).resolves.toEqual({
      enrollmentId: 'ENR012',
      status: 'REJECTED',
      rejectedBy: 'HR003',
      rejectedAt: '2026-05-15T10:00:00Z',
    });
  });
});
