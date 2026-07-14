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

  it('TC03 approves ENR003 when status is PENDING_APPROVAL', async () => {
    enrollmentRepository.findById.mockResolvedValue({
      id: 'ENR003',
      employeeId: 'EMP003',
      courseId: 'COM001',
      status: 'PENDING_APPROVAL',
    });
    enrollmentRepository.approve.mockResolvedValue({
      enrollmentId: 'ENR003',
      status: 'APPROVED',
      approvedBy: 'HR002',
      approvedAt: '2026-05-15T10:00:00Z',
    });

    await expect(
      service.approveEnrollment({ enrollmentId: 'ENR003', approvedBy: 'HR002' }),
    ).resolves.toEqual({
      enrollmentId: 'ENR003',
      status: 'APPROVED',
      approvedBy: 'HR002',
      approvedAt: '2026-05-15T10:00:00Z',
    });
  });
});
