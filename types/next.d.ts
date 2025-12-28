import { NextRequest } from "next/server";

declare module "next/server" {
  export interface RouteContext {
    params: Promise<Record<string, string>>;
  }

  export type RouteHandler = (
    req: NextRequest,
    context: RouteContext
  ) => Promise<Response> | Response;
}
