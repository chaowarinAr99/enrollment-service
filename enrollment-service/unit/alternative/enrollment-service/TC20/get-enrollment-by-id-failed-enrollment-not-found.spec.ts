import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { EnrollmentServiceImpl } from '../../../../src/services/enrollment.service.js';

describe('EnrollmentService.getEnrollmentById', () => {
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

  it('TC20 throws when enrollment is not found', async () => {
    enrollmentRepository.findById.mockResolvedValue(null);

    await expect(service.getEnrollmentById('ENR020')).rejects.toThrow('Enrollment not found');
  });
});
