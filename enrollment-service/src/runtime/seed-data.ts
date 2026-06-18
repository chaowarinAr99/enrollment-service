import type { Course } from '../models/course.js';
import type { Enrollment } from '../models/enrollment.js';

export type SeedState = {
  courses: Course[];
  enrollments: Enrollment[];
};

export function createSeedState(): SeedState {
  return {
    courses: [
      {
        id: 'PHY001',
        title: 'Physic with sir title',
        status: 'OPEN',
        seatLimit: 99,
        enrolledCount: 0,
      },
      {
        id: 'CHE001',
        title: 'Chemistry with sir title',
        status: 'OPEN',
        seatLimit: 99,
        enrolledCount: 1,
      },
      {
        id: 'COM001',
        title: 'Computer with sir title',
        status: 'OPEN',
        seatLimit: 99,
        enrolledCount: 98,
      },
      {
        id: 'MTH001',
        title: 'Math with sir title',
        status: 'CLOSED',
        seatLimit: 99,
        enrolledCount: 0,
      },
      {
        id: 'BIO001',
        title: 'Biology with sir title',
        status: 'OPEN',
        seatLimit: 99,
        enrolledCount: 99,
      },
    ],
    enrollments: [
      {
        id: 'ENR009',
        employeeId: 'EMP009',
        courseId: 'PHY001',
        status: 'PENDING_APPROVAL',
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        certificateStatus: null,
        certificateUrl: null,
        createdAt: '2026-05-15T09:00:00Z',
        updatedAt: '2026-05-15T09:00:00Z',
      },
      {
        id: 'ENR010',
        employeeId: 'EMP010',
        courseId: 'CHE001',
        status: 'APPROVED',
        approvedBy: 'HR001',
        approvedAt: '2026-05-15T10:00:00Z',
        rejectedBy: null,
        rejectedAt: null,
        certificateStatus: null,
        certificateUrl: null,
        createdAt: '2026-05-15T09:00:00Z',
        updatedAt: '2026-05-15T10:00:00Z',
      }
    ],
  };
}
