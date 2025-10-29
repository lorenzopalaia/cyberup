import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { DATA } from "./lib/data";
import { WS_INTERVAL } from "./lib/ws-config";
import { exec } from "child_process";
import { promisify } from "util";

const execP = promisify(exec);

// This file now only runs the WebSocket server.
// Default WS port is 3001 so you can run Next separately on 3000.
const WS_PORT = Number(process.env.WS_PORT) || 3001;

const state = {};
const ranges = {};
Object.values(DATA).forEach((m) => {
  state[m.key] = m.initial;
  ranges[m.key] = { min: m.min, max: m.max, step: m.step };
});

function incrementLoop(param) {
  state[param] += ranges[param].step;
  if (state[param] > ranges[param].max) {
    state[param] = ranges[param].min;
  }
}

const server = createServer((req, res) => {
  // simple health endpoint
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WebSocket server running\n");
    return;
  }

  res.writeHead(404);
  res.end();
});

let io;

const ERROR_BROADCAST_INTERVAL_MS = 30 * 1000;
setInterval(() => {
  try {
    if (io) {
      io.emit("errorCode", { errorCode: "ERR01" });
    }
  } catch (err) {}
}, ERROR_BROADCAST_INTERVAL_MS);

io = new IOServer(server, {
  path: "/ws",
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Client connected (socket.io)");

  const sendDataInterval = setInterval(() => {
    Object.keys(state).forEach((param) => incrementLoop(param));
    try {
      socket.emit("update", state);
    } catch (err) {
      console.error("Failed to emit update:", err);
    }
  }, WS_INTERVAL);

  socket.on("disconnect", () => {
    console.log("Client disconnected (socket.io)");
    clearInterval(sendDataInterval);
  });

  // per evitare concurrent runs per socket
  let updateRunning = false;

  // Riceve il trigger dal frontend per eseguire fetch/pull e invia progress via websocket
  socket.on("triggerUpdate", async () => {
    if (updateRunning) {
      socket.emit("updateError", { message: "Update già in esecuzione" });
      return;
    }
    updateRunning = true;

    try {
      socket.emit("updateProgress", {
        percent: 0,
        stage: "start",
        message: "Inizio update",
      });

      // 1) git fetch
      try {
        const fetchRes = await execP("git fetch", { cwd: process.cwd() });
        socket.emit("updateProgress", {
          percent: 25,
          stage: "fetch",
          message: fetchRes.stdout || "fetch completed",
          stderr: fetchRes.stderr || null,
        });
      } catch (fetchErr) {
        const msg =
          fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        socket.emit("updateError", {
          message: `Errore durante git fetch: ${msg}`,
        });
        updateRunning = false;
        return;
      }

      // 2) determinare upstream
      let upstream;
      try {
        const { stdout: upstreamStdout } = await execP(
          "git rev-parse --abbrev-ref --symbolic-full-name @{u}",
          { cwd: process.cwd() },
        );
        upstream = upstreamStdout.trim();
      } catch (upstreamErr) {
        const msg =
          upstreamErr instanceof Error
            ? upstreamErr.message
            : String(upstreamErr);
        socket.emit("updateError", {
          message: `Impossibile determinare upstream: ${msg}`,
        });
        updateRunning = false;
        return;
      }

      // 3) contare commit remoti non presenti in locale
      let behind = 0;
      try {
        const { stdout: countStdout } = await execP(
          `git rev-list --count HEAD..${upstream}`,
          { cwd: process.cwd() },
        );
        behind = parseInt(countStdout.trim() || "0", 10);
      } catch (countErr) {
        // non bloccante: log e procedi
        console.error(
          "Impossibile contare i commit dietro l'upstream:",
          countErr,
        );
      }

      if (behind > 0) {
        // Emit a mid-stage indicating pull will start
        socket.emit("updateProgress", {
          percent: 55,
          stage: "pull-start",
          message: `Eseguo git pull (${behind} commit)`,
        });

        try {
          const pullRes = await execP("git pull", { cwd: process.cwd() });
          socket.emit("updateProgress", {
            percent: 85,
            stage: "pull",
            message: pullRes.stdout || "pull completed",
            stderr: pullRes.stderr || null,
          });
        } catch (pullErr) {
          const msg =
            pullErr instanceof Error ? pullErr.message : String(pullErr);
          socket.emit("updateError", {
            message: `Errore durante git pull: ${msg}`,
          });
          updateRunning = false;
          return;
        }

        // 4) Se il pull ha portato modifiche, esegui build
        socket.emit("updateProgress", {
          percent: 90,
          stage: "build-start",
          message: "Eseguo npm run build",
        });

        try {
          const buildRes = await execP("npm run build", { cwd: process.cwd() });
          socket.emit("updateProgress", {
            percent: 98,
            stage: "build",
            message: buildRes.stdout || "build completed",
            stderr: buildRes.stderr || null,
          });
        } catch (buildErr) {
          const msg =
            buildErr instanceof Error ? buildErr.message : String(buildErr);
          socket.emit("updateError", {
            message: `Errore durante il build: ${msg}`,
          });
          updateRunning = false;
          return;
        }
      } else {
        socket.emit("updateProgress", {
          percent: 100,
          stage: "up-to-date",
          message: "Nessuna modifica remota da pullare",
        });
        updateRunning = false;
        return;
      }

      // Fine: segnala completamento
      socket.emit("updateProgress", {
        percent: 100,
        stage: "done",
        message: "Update completato",
      });
      socket.emit("updateComplete", { success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      socket.emit("updateError", {
        message: `Errore durante operazioni git: ${message}`,
      });
    } finally {
      updateRunning = false;
    }
  });
});

server.listen(WS_PORT, () => {
  console.log(
    `Socket.IO server listening on http://localhost:${WS_PORT} (path=/ws)`,
  );
});
