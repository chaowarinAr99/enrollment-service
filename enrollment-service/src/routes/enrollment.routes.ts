import type { EnrollmentController } from '../controllers/enrollment.controller.js';
import type { RouteHandler } from '../http.js';

type ErrorHandler = (error: unknown, ...args: unknown[]) => unknown;

type RouterLike = {
  post(path: string, handler: RouteHandler): unknown;
  patch(path: string, handler: RouteHandler): unknown;
  get(path: string, handler: RouteHandler): unknown;
  use(handler: ErrorHandler): unknown;
};

export function registerEnrollmentRoutes(
  router: RouterLike,
  controller: EnrollmentController,
  errorHandler: ErrorHandler,
) {
  router.post('/enrollments', controller.createEnrollment.bind(controller));
  router.patch(
    '/enrollments/:enrollmentId/approve',
    controller.approveEnrollment.bind(controller),
  );
  router.patch(
    '/enrollments/:enrollmentId/reject',
    controller.rejectEnrollment.bind(controller),
  );
  router.post(
    '/enrollments/:enrollmentId/certificate',
    controller.generateCertificate.bind(controller),
  );
  router.get(
    '/enrollments/:enrollmentId',
    controller.getEnrollmentById.bind(controller),
  );
  router.use(errorHandler);
}
