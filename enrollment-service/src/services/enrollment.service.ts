import {
  BadRequestError,
  CertificateApiError,
  CertificateApiTimeoutError,
  CourseClosedError,
  CourseFullError,
  CourseNotFoundError,
  DuplicateEnrollmentError,
  EnrollmentCannotBeRejectedError,
  EnrollmentNotFoundError,
  InvalidEnrollmentStatusError,
  InvalidCertificateResponseError,
  ProgressNotCompletedError,
} from '../errors/index.js';
import type {
  ApproveEnrollmentInput,
} from '../dto/approve-enrollment.input.js';
import type {
  CreateEnrollmentInput,
} from '../dto/create-enrollment.input.js';
import type { GenerateCertificateInput } from '../dto/generate-certificate.input.js';
import type {
  ApproveEnrollmentResult,
  CreateEnrollmentResult,
  EnrollmentDetail,
  GenerateCertificateResult,
  RejectEnrollmentResult,
} from '../dto/enrollment.result.js';
import type {
  RejectEnrollmentInput,
} from '../dto/reject-enrollment.input.js';
import type { Enrollment } from '../models/enrollment.js';
import type { CourseRepository } from '../repositories/course.repository.js';
import type { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import type { CertificateService } from './certificate.service.js';

function toOptionalIsoString(value?: string | Date): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function toEnrollmentDetail(enrollment: Enrollment): EnrollmentDetail {
  return {
    id: enrollment.id,
    employeeId: enrollment.employeeId,
    courseId: enrollment.courseId,
    status: enrollment.status,
    approvedBy: enrollment.approvedBy,
    approvedAt: enrollment.approvedAt,
    rejectedBy: enrollment.rejectedBy,
    rejectedAt: enrollment.rejectedAt,
    certificateStatus: enrollment.certificateStatus,
    certificateUrl: enrollment.certificateUrl,
    createdAt: toOptionalIsoString(enrollment.createdAt),
    updatedAt: toOptionalIsoString(enrollment.updatedAt),
  };
}

export interface EnrollmentService {
  createEnrollment(input: CreateEnrollmentInput): Promise<CreateEnrollmentResult>;
  approveEnrollment(input: ApproveEnrollmentInput): Promise<ApproveEnrollmentResult>;
  rejectEnrollment(input: RejectEnrollmentInput): Promise<RejectEnrollmentResult>;
  getEnrollmentById(enrollmentId: string): Promise<EnrollmentDetail>;
  generateCertificate(
    input: GenerateCertificateInput,
  ): Promise<GenerateCertificateResult>;
}

export class EnrollmentServiceImpl implements EnrollmentService {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly certificateService: CertificateService,
  ) {}

  async createEnrollment(
    input: CreateEnrollmentInput,
  ): Promise<CreateEnrollmentResult> {
    if (!input.employeeId) {
      throw new BadRequestError('employeeId is required');
    }

    if (!input.courseId) {
      throw new BadRequestError('courseId is required');
    }

    const course = await this.courseRepository.findById(input.courseId);

    if (!course) {
      throw new CourseNotFoundError('Course not found');
    }

    if (course.status !== 'OPEN') {
      throw new CourseClosedError('Course is not open for enrollment');
    }

    if (course.enrolledCount >= course.seatLimit) {
      throw new CourseFullError('Course is full');
    }

    const existingEnrollment =
      await this.enrollmentRepository.findActiveByEmployeeAndCourse(
        input.employeeId,
        input.courseId,
      );

    if (existingEnrollment) {
      throw new DuplicateEnrollmentError('Employee already enrolled');
    }

    const enrollment = await this.enrollmentRepository.create({
      employeeId: input.employeeId,
      courseId: input.courseId,
      status: 'PENDING_APPROVAL',
    });

    return {
      enrollmentId: enrollment.id,
      employeeId: enrollment.employeeId,
      courseId: enrollment.courseId,
      status: 'PENDING_APPROVAL',
    };
  }

  async approveEnrollment(
    input: ApproveEnrollmentInput,
  ): Promise<ApproveEnrollmentResult> {
    if (!input.enrollmentId) {
      throw new BadRequestError('enrollmentId is required');
    }

    if (!input.approvedBy) {
      throw new BadRequestError('approvedBy is required');
    }

    const enrollment = await this.enrollmentRepository.findById(input.enrollmentId);

    if (!enrollment) {
      throw new EnrollmentNotFoundError('Enrollment not found');
    }

    if (enrollment.status !== 'PENDING_APPROVAL') {
      throw new InvalidEnrollmentStatusError('Enrollment cannot be approved');
    }

    return this.enrollmentRepository.approve({
      enrollmentId: input.enrollmentId,
      approvedBy: input.approvedBy,
      approvedAt: new Date().toISOString(),
    });
  }

  async rejectEnrollment(
    input: RejectEnrollmentInput,
  ): Promise<RejectEnrollmentResult> {
    if (!input.enrollmentId) {
      throw new BadRequestError('enrollmentId is required');
    }

    if (!input.rejectedBy) {
      throw new BadRequestError('rejectedBy is required');
    }

    const enrollment = await this.enrollmentRepository.findById(input.enrollmentId);

    if (!enrollment) {
      throw new EnrollmentNotFoundError('Enrollment not found');
    }

    if (enrollment.status !== 'PENDING_APPROVAL') {
      throw new EnrollmentCannotBeRejectedError('Enrollment cannot be rejected');
    }

    return this.enrollmentRepository.reject({
      enrollmentId: input.enrollmentId,
      rejectedBy: input.rejectedBy,
      rejectedAt: new Date().toISOString(),
    });
  }

  async getEnrollmentById(enrollmentId: string): Promise<EnrollmentDetail> {
    if (!enrollmentId) {
      throw new BadRequestError('enrollmentId is required');
    }

    const enrollment = await this.enrollmentRepository.findById(enrollmentId);

    if (!enrollment) {
      throw new EnrollmentNotFoundError('Enrollment not found');
    }

    return toEnrollmentDetail(enrollment);
  }

  async generateCertificate(
    input: GenerateCertificateInput,
  ): Promise<GenerateCertificateResult> {
    if (!input.enrollmentId) {
      throw new BadRequestError('enrollmentId is required');
    }

    const enrollment = await this.enrollmentRepository.findById(input.enrollmentId);

    if (!enrollment) {
      throw new EnrollmentNotFoundError('Enrollment not found');
    }

    if (enrollment.status !== 'APPROVED') {
      throw new InvalidEnrollmentStatusError('Enrollment is not approved');
    }

    if (input.progress !== 100) {
      throw new ProgressNotCompletedError('Progress must be 100%');
    }

    try {
      const certificate = await this.certificateService.createCertificate({
        refId: enrollment.id,
        learnerId: enrollment.employeeId,
        courseRef: enrollment.courseId,
      });

      if (
        !certificate.certificate_id ||
        !certificate.certificate_url ||
        certificate.status !== 'issued' ||
        !certificate.issued_at
      ) {
        throw new InvalidCertificateResponseError('Cannot generate certificate');
      }

      await this.enrollmentRepository.updateCertificateStatus({
        enrollmentId: enrollment.id,
        certificateStatus: 'CERTIFICATE_ISSUED',
        certificateUrl: certificate.certificate_url,
      });

      return {
        enrollmentId: enrollment.id,
        certificateStatus: 'CERTIFICATE_ISSUED',
        certificate: {
          certificateId: certificate.certificate_id,
          certificateUrl: certificate.certificate_url,
          issuedAt: certificate.issued_at,
        },
      };
    } catch (error) {
      await this.enrollmentRepository.updateCertificateStatus({
        enrollmentId: enrollment.id,
        certificateStatus: 'CERTIFICATE_FAILED',
      });

      if (
        error instanceof InvalidCertificateResponseError ||
        error instanceof CertificateApiError ||
        error instanceof CertificateApiTimeoutError
      ) {
        throw error;
      }

      if (error instanceof Error && error.message === 'Certificate API timeout') {
        throw new CertificateApiTimeoutError('Certificate API timeout');
      }

      if (error instanceof Error) {
        throw new CertificateApiError(error.message || 'Cannot generate certificate');
      }

      throw error;
    }
  }
}
