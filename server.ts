import { createServer } from "http";
import next from "next";
import { initSocket } from "./src/server/socketServer";
import { startCleanupLoop } from "./src/domain/gameStore";

const port = parseInt(process.env.PORT ?? "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "0.0.0.0";

async function bootstrap() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();
  const server = createServer((req, res) => {
    handle(req, res);
  });

  initSocket(server);
  startCleanupLoop();

  server.listen(port, hostname, () => {
    console.log(`Impostor escuchando en http://${hostname}:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("No fue posible iniciar el servidor:", error);
  process.exit(1);
});
