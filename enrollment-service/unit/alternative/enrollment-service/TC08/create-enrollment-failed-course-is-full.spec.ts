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

  it('TC08 throws when course is full', async () => {
    courseRepository.findById.mockResolvedValue({
      id: 'BIO001',
      title: 'Biology with sir title',
      status: 'OPEN',
      seatLimit: 99,
      enrolledCount: 99,
    });

    await expect(
      service.createEnrollment({ employeeId: 'EMP008', courseId: 'BIO001' }),
    ).rejects.toThrow('Course is full');
  });
});
