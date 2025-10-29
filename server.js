import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { DATA } from "./lib/data.js";
import { WS_INTERVAL } from "./lib/ws-config.js";
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

/*
const ERROR_BROADCAST_INTERVAL_MS = 30 * 1000;
setInterval(() => {
  try {
    if (io) {
      io.emit("errorCode", { errorCode: "ERR01" });
    }
  } catch (err) {}
}, ERROR_BROADCAST_INTERVAL_MS);
*/

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
    console.log("Received Update Trigger");
    if (updateRunning) {
      console.log("Update already running, ignoring trigger");
      socket.emit("updateError", { message: "Update già in esecuzione" });
      return;
    }
    updateRunning = true;

    try {
      console.log("Starting update pipeline");
      socket.emit("updateProgress", {
        percent: 0,
        stage: "start",
        message: "Inizio update",
      });

      // 1) git fetch
      try {
        console.log("Running: git fetch");
        const fetchRes = await execP("git fetch", { cwd: process.cwd() });
        console.log("git fetch completed:", fetchRes.stdout || fetchRes.stderr);
        socket.emit("updateProgress", {
          percent: 25,
          stage: "fetch",
          message: fetchRes.stdout || "fetch completed",
          stderr: fetchRes.stderr || null,
        });
      } catch (fetchErr) {
        const msg =
          fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        console.error("Error during git fetch:", msg);
        socket.emit("updateError", {
          message: `Errore durante git fetch: ${msg}`,
        });
        updateRunning = false;
        return;
      }

      // 2) determinare upstream
      let upstream;
      try {
        console.log("Determining upstream");
        const { stdout: upstreamStdout } = await execP(
          "git rev-parse --abbrev-ref --symbolic-full-name @{u}",
          { cwd: process.cwd() },
        );
        upstream = upstreamStdout.trim();
        console.log("Upstream determined:", upstream);
      } catch (upstreamErr) {
        const msg =
          upstreamErr instanceof Error
            ? upstreamErr.message
            : String(upstreamErr);
        console.error("Unable to determine upstream:", msg);
        socket.emit("updateError", {
          message: `Impossibile determinare upstream: ${msg}`,
        });
        updateRunning = false;
        return;
      }

      // 3) contare commit remoti non presenti in locale
      let behind = 0;
      try {
        console.log(`Counting remote commits not present locally`);
        const { stdout: countStdout } = await execP(
          `git rev-list --count HEAD..${upstream}`,
          { cwd: process.cwd() },
        );
        behind = parseInt(countStdout.trim() || "0", 10);
        console.log("Commits behind upstream:", behind);
      } catch (countErr) {
        // non bloccante: log e procedi
        console.error("Unable to count commits behind upstream:", countErr);
      }

      if (behind > 0) {
        // Emit a mid-stage indicating pull will start
        console.log(`Starting git pull, ${behind} commits to fetch`);
        socket.emit("updateProgress", {
          percent: 55,
          stage: "pull-start",
          message: `Eseguo git pull (${behind} commit)`,
        });

        try {
          console.log("Running: git pull");
          const pullRes = await execP("git pull", { cwd: process.cwd() });
          console.log("git pull completed:", pullRes.stdout || pullRes.stderr);
          socket.emit("updateProgress", {
            percent: 85,
            stage: "pull",
            message: pullRes.stdout || "pull completed",
            stderr: pullRes.stderr || null,
          });
        } catch (pullErr) {
          const msg =
            pullErr instanceof Error ? pullErr.message : String(pullErr);
          console.error("Error during git pull:", msg);
          socket.emit("updateError", {
            message: `Errore durante git pull: ${msg}`,
          });
          updateRunning = false;
          return;
        }

        // 4) Se il pull ha portato modifiche, esegui npm install
        console.log("Starting install phase: npm install");
        socket.emit("updateProgress", {
          percent: 90,
          stage: "install-start",
          message: "Eseguo npm install",
        });

        try {
          const installRes = await execP("npm install", { cwd: process.cwd() });
          console.log(
            "Install completed:",
            installRes.stdout || installRes.stderr,
          );
          socket.emit("updateProgress", {
            percent: 94,
            stage: "install",
            message: installRes.stdout || "install completed",
            stderr: installRes.stderr || null,
          });
        } catch (installErr) {
          const msg =
            installErr instanceof Error
              ? installErr.message
              : String(installErr);
          console.error("Error during npm install:", msg);
          socket.emit("updateError", {
            message: `Errore durante npm install: ${msg}`,
          });
          updateRunning = false;
          return;
        }

        // 5) Esegui npm run build
        console.log("Starting build phase: npm run build");
        socket.emit("updateProgress", {
          percent: 95,
          stage: "build-start",
          message: "Eseguo npm run build",
        });

        try {
          const buildRes = await execP("npm run build", { cwd: process.cwd() });
          console.log("Build completed:", buildRes.stdout || buildRes.stderr);
          socket.emit("updateProgress", {
            percent: 98,
            stage: "build",
            message: buildRes.stdout || "build completed",
            stderr: buildRes.stderr || null,
          });
        } catch (buildErr) {
          const msg =
            buildErr instanceof Error ? buildErr.message : String(buildErr);
          console.error("Error during build:", msg);
          socket.emit("updateError", {
            message: `Errore durante il build: ${msg}`,
          });
          updateRunning = false;
          return;
        }
      } else {
        console.log("Repository already up-to-date. No pull needed.");
        socket.emit("updateProgress", {
          percent: 100,
          stage: "up-to-date",
          message: "Nessuna modifica remota da pullare",
        });
        updateRunning = false;
        return;
      }

      // TODO: 6) Termina il processo concurrently che esegue server e client, da capire come farlo

      // TODO: 7) Riavvia server + client con npm run start:all

      // Aspettare quei 1-2 secondi che si avviano, idealmente catturare output per capire quando sono pronti
      // Altrimenti si può fare un semplice delay fisso di qualche secondo
      // O forzare un reboot del raspberry
      // TODO: 8) Far ripartire chromium sempre in modalità kiosk sulla homepage -> ovvero reindirizzare se possibile

      // Fine: segnala completamento
      console.log("Update completed successfully");
      socket.emit("updateProgress", {
        percent: 100,
        stage: "done",
        message: "Update completato",
      });
      socket.emit("updateComplete", { success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error during git operations:", message);
      socket.emit("updateError", {
        message: `Errore durante operazioni git: ${message}`,
      });
    } finally {
      console.log("Resetting updateRunning = false");
      updateRunning = false;
    }
  });
});

server.listen(WS_PORT, () => {
  console.log(
    `Socket.IO server listening on http://localhost:${WS_PORT} (path=/ws)`,
  );
});
