import type {
  ExternalCertificateRequest,
  ExternalCertificateResponse,
} from '../dto/enrollment.result.js';
import {
  CertificateApiError,
  CertificateApiTimeoutError,
  InvalidCertificateResponseError,
} from '../errors/index.js';

export interface CertificateService {
  createCertificate(
    input: ExternalCertificateRequest,
  ): Promise<ExternalCertificateResponse>;
}

export type CertificateServiceConfig = {
  apiUrl: string;
  timeoutMs: number;
};

export function getCertificateServiceConfig(
  environment: NodeJS.ProcessEnv = process.env,
): CertificateServiceConfig {
  return {
    apiUrl:
      environment.CERTIFICATE_API_URL ??
      'http://localhost:4545/certificates',
    timeoutMs: Number(environment.CERTIFICATE_API_TIMEOUT_MS ?? 3000),
  };
}

export class HttpCertificateService implements CertificateService {
  constructor(
    private readonly config: CertificateServiceConfig = getCertificateServiceConfig(),
  ) {}

  async createCertificate(
    input: ExternalCertificateRequest,
  ): Promise<ExternalCertificateResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new CertificateApiError(
          `Certificate API returned status ${response.status}`,
        );
      }

      const body = (await response.json()) as Partial<ExternalCertificateResponse>;

      if (
        !body ||
        typeof body.certificate_id !== 'string' ||
        typeof body.certificate_url !== 'string' ||
        (body.status !== 'issued' && body.status !== 'failed') ||
        typeof body.issued_at !== 'string'
      ) {
        throw new InvalidCertificateResponseError('Cannot generate certificate');
      }

      return body as ExternalCertificateResponse;
    } catch (error) {
      if (error instanceof InvalidCertificateResponseError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new CertificateApiTimeoutError('Certificate API timeout');
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new CertificateApiTimeoutError('Certificate API timeout');
      }

      if (error instanceof CertificateApiError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new CertificateApiError(error.message);
      }

      throw new CertificateApiError('Cannot generate certificate');
    } finally {
      clearTimeout(timeout);
    }
  }
}
