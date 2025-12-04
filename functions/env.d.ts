// Cloudflare Workers types for Pages Functions
/// <reference types="@cloudflare/workers-types" />

declare module '*.ts' {
    export function onRequest(context: EventContext<Env, any, any>): Promise<Response> | Response;
}

interface Env {
    DB: D1Database;
    PBKDF2_ITERATIONS: string;
    JWT_SECRET: string;
}
