import type { ApproveEnrollmentRequest } from '../dto/approve-enrollment.request.js';
import type { CreateEnrollmentRequest } from '../dto/create-enrollment.request.js';
import type { GenerateCertificateRequest } from '../dto/generate-certificate.request.js';
import type { RejectEnrollmentRequest } from '../dto/reject-enrollment.request.js';
import type { HttpRequest, HttpResponse, NextFunction } from '../http.js';
import type { EnrollmentService } from '../services/enrollment.service.js';

type EnrollmentIdParams = {
  enrollmentId: string;
};

export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  async createEnrollment(
    request: HttpRequest<Record<string, string>, CreateEnrollmentRequest>,
    response: HttpResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.enrollmentService.createEnrollment(request.body);
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async approveEnrollment(
    request: HttpRequest<EnrollmentIdParams, ApproveEnrollmentRequest>,
    response: HttpResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.enrollmentService.approveEnrollment(
        {
          enrollmentId: request.params.enrollmentId,
          approvedBy: request.body.approvedBy,
        },
      );
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async rejectEnrollment(
    request: HttpRequest<EnrollmentIdParams, RejectEnrollmentRequest>,
    response: HttpResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.enrollmentService.rejectEnrollment(
        {
          enrollmentId: request.params.enrollmentId,
          rejectedBy: request.body.rejectedBy,
        },
      );
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getEnrollmentById(
    request: HttpRequest<EnrollmentIdParams>,
    response: HttpResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.enrollmentService.getEnrollmentById(
        request.params.enrollmentId,
      );
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async generateCertificate(
    request: HttpRequest<EnrollmentIdParams, GenerateCertificateRequest>,
    response: HttpResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.enrollmentService.generateCertificate({
        enrollmentId: request.params.enrollmentId,
        progress: request.body.progress,
      });
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
