declare module "@tanstack/react-start/api" {
  export function createAPIFileRoute(path: string): (options: {
    GET?: (ctx: { request: Request }) => Promise<Response> | Response;
    POST?: (ctx: { request: Request }) => Promise<Response> | Response;
  }) => any;
}
