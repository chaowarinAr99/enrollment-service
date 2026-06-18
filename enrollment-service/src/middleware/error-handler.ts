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
import type { HttpRequest, HttpResponse, NextFunction } from '../http.js';

export function errorHandler(
  error: unknown,
  _request: HttpRequest,
  response: HttpResponse,
  next: NextFunction,
) {
  if (!error || !(error instanceof Error)) {
    return next(error);
  }

  if (
    error instanceof BadRequestError ||
    error.message === 'employeeId is required' ||
    error.message === 'courseId is required' ||
    error.message === 'enrollmentId is required' ||
    error.message === 'approvedBy is required' ||
    error.message === 'rejectedBy is required'
  ) {
    return response.status(400).json({ message: error.message });
  }

  if (
    error instanceof CourseNotFoundError ||
    error instanceof EnrollmentNotFoundError ||
    error.message === 'Course not found' ||
    error.message === 'Enrollment not found'
  ) {
    return response.status(404).json({ message: error.message });
  }

  if (
    error instanceof CourseClosedError ||
    error instanceof CourseFullError ||
    error instanceof DuplicateEnrollmentError ||
    error instanceof InvalidEnrollmentStatusError ||
    error instanceof EnrollmentCannotBeRejectedError ||
    error instanceof ProgressNotCompletedError ||
    error.message === 'Course is not open for enrollment' ||
    error.message === 'Course is full' ||
    error.message === 'Employee already enrolled' ||
    error.message === 'Enrollment cannot be approved' ||
    error.message === 'Enrollment cannot be rejected' ||
    error.message === 'Enrollment is not approved' ||
    error.message === 'Progress must be 100%'
  ) {
    return response.status(409).json({ message: error.message });
  }

  if (
    error instanceof CertificateApiTimeoutError ||
    error.message === 'Certificate API timeout'
  ) {
    return response.status(504).json({
      message: 'Certificate API timeout',
      code: 'CERTIFICATE_API_TIMEOUT',
    });
  }

  if (
    error instanceof CertificateApiError ||
    error instanceof InvalidCertificateResponseError ||
    error.message === 'Cannot generate certificate'
  ) {
    return response.status(502).json({
      message: 'Cannot generate certificate',
      code: 'CERTIFICATE_API_ERROR',
    });
  }

  return response.status(500).json({ message: 'Internal server error' });
}
