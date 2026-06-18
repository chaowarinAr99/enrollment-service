import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { EnrollmentServiceImpl } from '../../../../src/services/enrollment.service.js';

describe('EnrollmentService.approveEnrollment', () => {
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

  it('TC01 approves ENR001 when status is PENDING_APPROVAL', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR001',
      employeeId: 'EMP001',
      courseId: 'PHY001',
      status: 'PENDING_APPROVAL',
    });
    enrollmentRepository.approve.mockResolvedValue({
      enrollmentId: 'ENR001',
      status: 'APPROVED',
      approvedBy: 'HR001',
      approvedAt: '2026-05-15T10:00:00Z',
    });

    await expect(
      service.approveEnrollment({ enrollmentId: 'ENR001', approvedBy: 'HR001' }),
    ).resolves.toEqual({
      enrollmentId: 'ENR001',
      status: 'APPROVED',
      approvedBy: 'HR001',
      approvedAt: '2026-05-15T10:00:00Z',
    });
  });
});
