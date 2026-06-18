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

  it('TC07 throws when course is not open for enrollment', async () => {
    courseRepository.findById.mockResolvedValue({
      id: 'MTH001',
      title: 'Math with sir title',
      status: 'CLOSED',
      seatLimit: 99,
      enrolledCount: 0,
    });

    await expect(
      service.createEnrollment({ employeeId: 'EMP007', courseId: 'MTH001' }),
    ).rejects.toThrow('Course is not open for enrollment');
  });
});
