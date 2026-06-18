import type {
  ApproveEnrollmentResult,
  RejectEnrollmentResult,
} from '../dto/enrollment.result.js';
import type {
  CertificateStatus,
  Enrollment,
  EnrollmentStatus,
} from '../models/enrollment.js';

export interface EnrollmentRepository {
  findById(enrollmentId: string): Promise<Enrollment | null>;

  findActiveByEmployeeAndCourse(
    employeeId: string,
    courseId: string,
  ): Promise<Enrollment | null>;

  create(input: {
    employeeId: string;
    courseId: string;
    status: EnrollmentStatus;
  }): Promise<Enrollment>;

  approve(input: {
    enrollmentId: string;
    approvedBy: string;
    approvedAt: string;
  }): Promise<ApproveEnrollmentResult>;

  reject(input: {
    enrollmentId: string;
    rejectedBy: string;
    rejectedAt: string;
  }): Promise<RejectEnrollmentResult>;

  updateCertificateStatus(input: {
    enrollmentId: string;
    certificateStatus: CertificateStatus;
    certificateUrl?: string;
  }): Promise<void>;
}
