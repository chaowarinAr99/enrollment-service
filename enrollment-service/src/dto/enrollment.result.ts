export type CreateEnrollmentResult = {
  enrollmentId: string;
  employeeId: string;
  courseId: string;
  status: 'PENDING_APPROVAL';
};

export type ApproveEnrollmentResult = {
  enrollmentId: string;
  status: 'APPROVED';
  approvedBy: string;
  approvedAt: string;
};

export type RejectEnrollmentResult = {
  enrollmentId: string;
  status: 'REJECTED';
  rejectedBy: string;
  rejectedAt: string;
};

export type GenerateCertificateResult = {
  enrollmentId: string;
  certificateStatus: 'CERTIFICATE_ISSUED' | 'CERTIFICATE_FAILED';
  certificate: {
    certificateId: string;
    certificateUrl: string;
    issuedAt: string;
  } | null;
};

export type ExternalCertificateRequest = {
  refId: string;
  learnerId: string;
  courseRef: string;
};

export type ExternalCertificateResponse = {
  certificate_id: string;
  certificate_url: string;
  status: 'issued' | 'failed';
  issued_at: string;
};

export type EnrollmentDetail = {
  id: string;
  employeeId: string;
  courseId: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  certificateStatus?: 'CERTIFICATE_ISSUED' | 'CERTIFICATE_FAILED' | null;
  certificateUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
