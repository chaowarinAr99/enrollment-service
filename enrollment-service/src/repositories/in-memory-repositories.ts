import type { Course } from '../models/course.js';
import type {
  CertificateStatus,
  Enrollment,
  EnrollmentStatus,
} from '../models/enrollment.js';
import { createSeedState, type SeedState } from '../runtime/seed-data.js';
import type { CourseRepository } from './course.repository.js';
import type { EnrollmentRepository } from './enrollment.repository.js';

function cloneEnrollment(enrollment: Enrollment): Enrollment {
  return {
    ...enrollment,
  };
}

function cloneCourse(course: Course): Course {
  return {
    ...course,
  };
}

export class InMemoryCourseRepository implements CourseRepository {
  constructor(private readonly courses: Course[]) {}

  async findById(courseId: string): Promise<Course | null> {
    const course = this.courses.find((entry) => entry.id === courseId);
    return course ? cloneCourse(course) : null;
  }
}

export class InMemoryEnrollmentRepository implements EnrollmentRepository {
  constructor(
    private readonly enrollments: Enrollment[],
    private readonly courses: Course[],
  ) {}

  private nextEnrollmentId(): string {
    const highestNumber = this.enrollments.reduce((max, enrollment) => {
      const match = enrollment.id.match(/^ENR(\d{3})$/);
      const value = Number(match?.[1] ?? 0);
      return Math.max(max, value);
    }, 0);

    return `ENR${String(highestNumber + 1).padStart(3, '0')}`;
  }

  async findById(enrollmentId: string): Promise<Enrollment | null> {
    const enrollment = this.enrollments.find((entry) => entry.id === enrollmentId);
    return enrollment ? cloneEnrollment(enrollment) : null;
  }

  async findActiveByEmployeeAndCourse(
    employeeId: string,
    courseId: string,
  ): Promise<Enrollment | null> {
    const enrollment = this.enrollments.find(
      (entry) =>
        entry.employeeId === employeeId &&
        entry.courseId === courseId &&
        (entry.status === 'PENDING_APPROVAL' || entry.status === 'APPROVED'),
    );

    return enrollment ? cloneEnrollment(enrollment) : null;
  }

  async create(input: {
    employeeId: string;
    courseId: string;
    status: EnrollmentStatus;
  }): Promise<Enrollment> {
    const now = new Date().toISOString();
    const enrollment: Enrollment = {
      id: this.nextEnrollmentId(),
      employeeId: input.employeeId,
      courseId: input.courseId,
      status: input.status,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      certificateStatus: null,
      certificateUrl: null,
      createdAt: now,
      updatedAt: now,
    };

    this.enrollments.push(enrollment);

    const course = this.courses.find((entry) => entry.id === input.courseId);
    if (course) {
      course.enrolledCount += 1;
    }

    return cloneEnrollment(enrollment);
  }

  async approve(input: {
    enrollmentId: string;
    approvedBy: string;
    approvedAt: string;
  }) {
    const enrollment = this.enrollments.find((entry) => entry.id === input.enrollmentId);
    if (enrollment) {
      enrollment.status = 'APPROVED';
      enrollment.approvedBy = input.approvedBy;
      enrollment.approvedAt = input.approvedAt;
      enrollment.updatedAt = input.approvedAt;
    }

    return {
      enrollmentId: input.enrollmentId,
      status: 'APPROVED' as const,
      approvedBy: input.approvedBy,
      approvedAt: input.approvedAt,
    };
  }

  async reject(input: {
    enrollmentId: string;
    rejectedBy: string;
    rejectedAt: string;
  }) {
    const enrollment = this.enrollments.find((entry) => entry.id === input.enrollmentId);
    if (enrollment) {
      enrollment.status = 'REJECTED';
      enrollment.rejectedBy = input.rejectedBy;
      enrollment.rejectedAt = input.rejectedAt;
      enrollment.updatedAt = input.rejectedAt;
    }

    return {
      enrollmentId: input.enrollmentId,
      status: 'REJECTED' as const,
      rejectedBy: input.rejectedBy,
      rejectedAt: input.rejectedAt,
    };
  }

  async updateCertificateStatus(input: {
    enrollmentId: string;
    certificateStatus: CertificateStatus;
    certificateUrl?: string;
  }): Promise<void> {
    const enrollment = this.enrollments.find((entry) => entry.id === input.enrollmentId);
    if (!enrollment) {
      return;
    }

    enrollment.certificateStatus = input.certificateStatus;
    enrollment.certificateUrl = input.certificateUrl ?? null;
    enrollment.updatedAt = new Date().toISOString();
  }
}
