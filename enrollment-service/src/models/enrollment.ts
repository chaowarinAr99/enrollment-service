export type EnrollmentStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type CertificateStatus =
  | 'CERTIFICATE_ISSUED'
  | 'CERTIFICATE_FAILED';

export type Enrollment = {
  id: string;
  employeeId: string;
  courseId: string;
  status: EnrollmentStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  certificateStatus?: CertificateStatus | null;
  certificateUrl?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};
