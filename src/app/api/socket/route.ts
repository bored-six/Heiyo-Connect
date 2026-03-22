// This file serves as documentation for the Socket.io setup.
// The actual Socket.io server runs in server.ts (custom Next.js server).
// See /src/lib/socket-server.ts for implementation.

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response("Socket.io is handled by the custom server at /server.ts", {
    status: 200,
  });
}
