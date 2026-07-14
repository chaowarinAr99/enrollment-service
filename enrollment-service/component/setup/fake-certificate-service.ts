import { jest } from '@jest/globals';

import type {
  ExternalCertificateRequest,
  ExternalCertificateResponse,
} from '../../src/dto/enrollment.result.js';
import {
  CertificateApiError,
  CertificateApiTimeoutError,
  InvalidCertificateResponseError,
} from '../../src/errors/index.js';
import type { CertificateService } from '../../src/services/certificate.service.js';

export type FakeCertificateService = CertificateService & {
  createCertificate: jest.MockedFunction<CertificateService['createCertificate']>;
};

export function createFakeCertificateService(): FakeCertificateService {
  return {
    createCertificate: jest.fn<CertificateService['createCertificate']>(),
  };
}

export function stubCertificateSuccess(
  service: FakeCertificateService,
  response: ExternalCertificateResponse,
) {
  service.createCertificate.mockResolvedValue(response);
}

export function expectCertificateRequest(
  service: FakeCertificateService,
  expectedRequest: ExternalCertificateRequest,
) {
  expect(service.createCertificate).toHaveBeenCalledWith(expectedRequest);
}

export function stubCertificateApiError(service: FakeCertificateService) {
  service.createCertificate.mockRejectedValue(
    new CertificateApiError('Cannot generate certificate'),
  );
}

export function stubCertificateTimeout(service: FakeCertificateService) {
  service.createCertificate.mockRejectedValue(
    new CertificateApiTimeoutError('Certificate API timeout'),
  );
}

export function stubInvalidCertificateResponse(service: FakeCertificateService) {
  service.createCertificate.mockRejectedValue(
    new InvalidCertificateResponseError('Cannot generate certificate'),
  );
}
