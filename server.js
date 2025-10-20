const { createServer } = require("http");
const next = require("next");
const WebSocket = require("ws");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

let state = {
  speed: 0,
  rpm: 800,
  engineTemp: 90,
  fuelLevel: 100,
  battery: 12.6,
};

const ranges = {
  speed: { min: 0, max: 180, step: 1 },
  rpm: { min: 0, max: 6500, step: 100 },
  engineTemp: { min: 70, max: 105, step: 0.5 },
  fuelLevel: { min: 0, max: 100, step: 1 },
  battery: { min: 11.8, max: 14.6, step: 0.01 },
};

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

    const sendDataInterval = setInterval(() => {
      Object.keys(state).forEach((param) => incrementLoop(param));

      try {
        ws.send(JSON.stringify(state));
      } catch (err) {
        console.error("Failed to send ws message:", err);
      }
    }, 50);

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
