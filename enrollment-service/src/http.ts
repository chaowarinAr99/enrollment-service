export type HttpRequest<
  Params extends Record<string, string> = Record<string, string>,
  Body = unknown,
> = {
  params: Params;
  body: Body;
};

export type HttpResponse = {
  status(code: number): HttpResponse;
  json(payload: unknown): unknown;
};

export type NextFunction = (error?: unknown) => unknown;

export type RouteHandler = (
  request: HttpRequest,
  response: HttpResponse,
  next: NextFunction,
) => unknown;
