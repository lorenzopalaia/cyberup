const { createServer } = require("http");
const { Server: IOServer } = require("socket.io");
const { DATA } = require("./lib/data");
const { WS_INTERVAL } = require("./lib/ws-config");

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
});

server.listen(WS_PORT, () => {
  console.log(
    `Socket.IO server listening on http://localhost:${WS_PORT} (path=/ws)`,
  );
});
