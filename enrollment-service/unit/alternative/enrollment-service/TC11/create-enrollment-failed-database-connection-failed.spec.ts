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

  it('TC11 rethrows repository error when create fails', async () => {
    courseRepository.findById.mockResolvedValue({
      id: 'COM001',
      title: 'Computer with sir title',
      status: 'OPEN',
      seatLimit: 99,
      enrolledCount: 98,
    });
    enrollmentRepository.findActiveByEmployeeAndCourse.mockResolvedValue(null);
    enrollmentRepository.create.mockRejectedValue(new Error('Database connection failed'));

    await expect(
      service.createEnrollment({ employeeId: 'EMP011', courseId: 'COM001' }),
    ).rejects.toThrow('Database connection failed');
  });
});
