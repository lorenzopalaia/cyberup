const { createServer } = require("http");
const next = require("next");
const WebSocket = require("ws");
const { METRICS } = require("./lib/metrics");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

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

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocket.Server({ noServer: true });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    const WS_INTERVAL_MS = dev ? 500 : 10;

    const sendDataInterval = setInterval(() => {
      Object.keys(state).forEach((param) => incrementLoop(param));

      try {
        ws.send(JSON.stringify(state));
      } catch (err) {
        console.error("Failed to send ws message:", err);
      }
    }, WS_INTERVAL_MS);

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

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
});
