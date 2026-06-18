import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { EnrollmentServiceImpl } from '../../../../src/services/enrollment.service.js';

describe('EnrollmentService.createEnrollment', () => {
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

  it('TC13 creates enrollment by course chemistry', async () => {
    courseRepository.findById.mockResolvedValue({
          id: "CHE001",
          title: "Chemistry with sir title",
          status: "OPEN",
          seatLimit: 98,
          enrolledCount: 1
    });

    enrollmentRepository.findActiveByEmployeeAndCourse.mockResolvedValue(null);

    enrollmentRepository.create.mockResolvedValue({
      id: 'ENR013',
      employeeId: 'EMP013',
      courseId: 'CHE001',
      status: 'PENDING_APPROVAL',
    });

    const result = await service.createEnrollment({
      employeeId: 'EMP013',
      courseId: 'CHE001',
    });

    expect(result).toEqual({
      enrollmentId: 'ENR013',
      employeeId: 'EMP013',
      courseId: 'CHE001',
      status: 'PENDING_APPROVAL',
    });

    expect(courseRepository.findById).toHaveBeenCalledWith('CHE001');
    expect(enrollmentRepository.findActiveByEmployeeAndCourse).toHaveBeenCalledWith(
      'EMP013',
      'CHE001',
    );
    expect(enrollmentRepository.create).toHaveBeenCalledWith({
      employeeId: 'EMP013',
      courseId: 'CHE001',
      status: 'PENDING_APPROVAL',
    });
  });
});
