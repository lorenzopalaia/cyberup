const { createServer } = require("http");
const WebSocket = require("ws");
const { METRICS } = require("./lib/metrics");
const { WS_INTERVAL } = require("./lib/ws-config");

// This file now only runs the WebSocket server.
// Default WS port is 3001 so you can run Next separately on 3000.
const WS_PORT = Number(process.env.WS_PORT) || 3001;

const state = {};
const ranges = {};
Object.values(METRICS).forEach((m) => {
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

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
  console.log("Client connected");

  const sendDataInterval = setInterval(() => {
    Object.keys(state).forEach((param) => incrementLoop(param));

    try {
      ws.send(JSON.stringify(state));
    } catch (err) {
      console.error("Failed to send ws message:", err);
    }
  }, WS_INTERVAL);

  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(sendDataInterval);
  });
});

server.on("upgrade", (req, socket, head) => {
  const { url } = req;
  if (url === "/ws") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

server.listen(WS_PORT, () => {
  console.log(`WebSocket server listening on ws://localhost:${WS_PORT}/ws`);
});
