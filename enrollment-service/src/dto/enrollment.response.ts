import type {
  ApproveEnrollmentResult,
  CreateEnrollmentResult,
  EnrollmentDetail,
  GenerateCertificateResult,
  RejectEnrollmentResult,
} from './enrollment.result.js';

export type CreateEnrollmentResponse = CreateEnrollmentResult;
export type ApproveEnrollmentResponse = ApproveEnrollmentResult;
export type RejectEnrollmentResponse = RejectEnrollmentResult;
export type GenerateCertificateResponse = GenerateCertificateResult;
export type EnrollmentResponse = EnrollmentDetail;
