/**
 * Custom Next.js server that attaches Socket.io.
 *
 * Run with: npx ts-node --skip-project --compiler-options '{"module":"CommonJS"}' server.ts
 * Or add to package.json scripts: "dev:socket": "ts-node server.ts"
 *
 * Note: Standard `next dev` does NOT run Socket.io.
 * For production, consider Pusher or Ably as a hosted alternative (see below).
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { attachSocketServer } from "./src/lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.io to the same HTTP server
  attachSocketServer(httpServer);

  const PORT = parseInt(process.env.PORT ?? "3000", 10);
  httpServer.listen(PORT, () => {
    console.log(`> Heiyo-Connect ready on http://localhost:${PORT}`);
    console.log(`> Socket.io attached at /api/socket`);
  });
});
