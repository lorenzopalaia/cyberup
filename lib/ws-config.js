// Use NEXT_PUBLIC_WS_INTERVAL to override from environment when needed.
const WS_INTERVAL =
  Number(process.env.NEXT_PUBLIC_WS_INTERVAL) ||
  (process.env.NODE_ENV !== "production" ? 500 : 10);

const HISTORY_SECONDS = 15 * 60; // default 15 minutes

const DATA_POINTS = Math.max(
  1,
  Math.ceil((HISTORY_SECONDS * 1000) / WS_INTERVAL),
);

module.exports = {
  WS_INTERVAL,
  DATA_POINTS,
};
