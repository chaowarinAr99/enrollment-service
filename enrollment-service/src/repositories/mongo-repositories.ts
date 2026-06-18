import type {
  ApproveEnrollmentResult,
  RejectEnrollmentResult,
} from '../dto/enrollment.result.js';
import type { CourseRepository } from './course.repository.js';
import type { EnrollmentRepository } from './enrollment.repository.js';
import type {
  CertificateStatus,
  Enrollment,
  EnrollmentStatus,
} from '../models/enrollment.js';
import type { Course } from '../models/course.js';

type MongoCollection<T> = {
  findOne(
    query: Record<string, unknown>,
    options?: { sort?: Record<string, 1 | -1> },
  ): Promise<T | null>;
  insertOne(document: T): Promise<unknown>;
  updateOne(
    query: Record<string, unknown>,
    update: Record<string, unknown>,
  ): Promise<unknown>;
};

type CourseDocument = {
  _id?: unknown;
  id: string;
  title: string;
  status: 'open' | 'OPEN' | 'closed' | 'CLOSED';
  seatLimit: number;
  enrolledCount: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type EnrollmentDocument = {
  _id?: unknown;
  id: string;
  employeeId: string;
  courseId: string;
  status: EnrollmentStatus;
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  rejectedBy?: string | null;
  rejectedAt?: Date | string | null;
  certificateStatus?: CertificateStatus | null;
  certificateUrl?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function toIsoString(value?: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function mapCourse(doc: CourseDocument | null): Course | null {
  if (!doc) return null;

  return {
    id: doc.id,
    title: doc.title,
    status: String(doc.status).toUpperCase() === 'OPEN' ? 'OPEN' : 'CLOSED',
    seatLimit: doc.seatLimit,
    enrolledCount: doc.enrolledCount,
  };
}

function mapEnrollment(doc: EnrollmentDocument | null): Enrollment | null {
  if (!doc || !doc.createdAt || !doc.updatedAt) return null;

  return {
    id: doc.id,
    employeeId: doc.employeeId,
    courseId: doc.courseId,
    status: doc.status,
    approvedBy: doc.approvedBy ?? null,
    approvedAt: toIsoString(doc.approvedAt),
    rejectedBy: doc.rejectedBy ?? null,
    rejectedAt: toIsoString(doc.rejectedAt),
    certificateStatus: doc.certificateStatus ?? null,
    certificateUrl: doc.certificateUrl ?? null,
    createdAt: toIsoString(doc.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIsoString(doc.updatedAt) ?? new Date(0).toISOString(),
  };
}

export class MongoCourseRepository implements CourseRepository {
  constructor(private readonly collection: MongoCollection<CourseDocument>) {}

  async findById(courseId: string): Promise<Course | null> {
    const doc = await this.collection.findOne({ id: courseId });
    return mapCourse(doc);
  }
}

export class MongoEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly collection: MongoCollection<EnrollmentDocument>) {}

  private async nextEnrollmentId(): Promise<string> {
    const lastEnrollment = await this.collection.findOne({}, { sort: { id: -1 } });
    const lastNumber = lastEnrollment?.id?.match(/^ENR(\d{3})$/)?.[1];
    const nextNumber = Number(lastNumber ?? 0) + 1;
    return `ENR${String(nextNumber).padStart(3, '0')}`;
  }

  async findActiveByEmployeeAndCourse(
    employeeId: string,
    courseId: string,
  ): Promise<Enrollment | null> {
    const doc = await this.collection.findOne({
      employeeId,
      courseId,
      status: { $in: ['PENDING_APPROVAL', 'APPROVED'] },
    });

    return mapEnrollment(doc);
  }

  async create(input: {
    employeeId: string;
    courseId: string;
    status: EnrollmentStatus;
  }): Promise<Enrollment> {
    const now = new Date();
    const document: EnrollmentDocument = {
      id: await this.nextEnrollmentId(),
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

    await this.collection.insertOne(document);

    return mapEnrollment(document) as Enrollment;
  }

  async findById(enrollmentId: string): Promise<Enrollment | null> {
    const doc = await this.collection.findOne({ id: enrollmentId });
    return mapEnrollment(doc);
  }

  async approve(input: {
    enrollmentId: string;
    approvedBy: string;
    approvedAt: string;
  }): Promise<ApproveEnrollmentResult> {
    await this.collection.updateOne(
      { id: input.enrollmentId },
      {
        $set: {
          status: 'APPROVED',
          approvedBy: input.approvedBy,
          approvedAt: input.approvedAt,
          updatedAt: new Date(input.approvedAt),
        },
      },
    );

    return {
      enrollmentId: input.enrollmentId,
      status: 'APPROVED',
      approvedBy: input.approvedBy,
      approvedAt: input.approvedAt,
    };
  }

  async reject(input: {
    enrollmentId: string;
    rejectedBy: string;
    rejectedAt: string;
  }): Promise<RejectEnrollmentResult> {
    await this.collection.updateOne(
      { id: input.enrollmentId },
      {
        $set: {
          status: 'REJECTED',
          rejectedBy: input.rejectedBy,
          rejectedAt: input.rejectedAt,
          updatedAt: new Date(input.rejectedAt),
        },
      },
    );

    return {
      enrollmentId: input.enrollmentId,
      status: 'REJECTED',
      rejectedBy: input.rejectedBy,
      rejectedAt: input.rejectedAt,
    };
  }

  async updateCertificateStatus(input: {
    enrollmentId: string;
    certificateStatus: CertificateStatus;
    certificateUrl?: string;
  }): Promise<void> {
    await this.collection.updateOne(
      { id: input.enrollmentId },
      {
        $set: {
          certificateStatus: input.certificateStatus,
          certificateUrl: input.certificateUrl,
          updatedAt: new Date(),
        },
      },
    );
  }
}
