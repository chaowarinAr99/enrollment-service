import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { EnrollmentServiceImpl } from '../../../../src/services/enrollment.service.js';

describe('EnrollmentService.createEnrollment', () => {
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

  it('TC03 creates enrollment for COM001 when one seat remains', async () => {
    courseRepository.findById.mockResolvedValue({
      id: 'COM001',
      title: 'Computer with sir title',
      status: 'OPEN',
      seatLimit: 99,
      enrolledCount: 98,
    });
    enrollmentRepository.findActiveByEmployeeAndCourse.mockResolvedValue(null);
    enrollmentRepository.create.mockResolvedValue({
      id: 'ENR003',
      employeeId: 'EMP003',
      courseId: 'COM001',
      status: 'PENDING_APPROVAL',
    });

    await expect(
      service.createEnrollment({ employeeId: 'EMP003', courseId: 'COM001' }),
    ).resolves.toEqual({
      enrollmentId: 'ENR003',
      employeeId: 'EMP003',
      courseId: 'COM001',
      status: 'PENDING_APPROVAL',
    });
  });
});
