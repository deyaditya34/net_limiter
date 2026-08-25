# net_limiter

net_limiter is a lightweight Linux utility (Node.js) that monitors system network usage by reading `/sys/class/net/*/statistics` and sends desktop notifications when configured thresholds are reached.

## Features

- Aggregates RX + TX bytes across discovered network interfaces
- Sends desktop notifications with `notify-send` when thresholds are crossed
- Persists simple state to `state.json` so usage and notification progress survive restarts

## Requirements

- Node.js 16 or newer
- Linux with `/sys/class/net` available
- `notify-send` (from libnotify) installed and available on PATH

## Install

Clone the repo and (optionally) install dependencies. This project has no external runtime dependencies by default.

```bash
git clone https://github.com/<your-org>/net_limiter.git
cd net_limiter
npm install
```

## Usage

Start the monitor with Node.js (the main script is `src/index.js`):

```bash
node src/index.js
```

The process polls network statistics once per second and writes a small `state.json` file to the project directory to persist `accumulated` usage and notification state.

## Configuration & State

- Edit `src/index.js` to change behavior:
  - `ONE_MB` — byte unit used for reporting
  - `notifiedMb` — notification interval in MB (default: 10)
  - `INTERFACE_LIST_PATH` — path scanned for network interfaces
- Persistent state is stored in `state.json` in the project root. The file contains counters and last-notified thresholds to avoid repeated notifications across restarts.

## Troubleshooting

- If you do not receive notifications, ensure `notify-send` is installed and that a notification daemon is running for your desktop session.
- The tool reads all entries in `/sys/class/net`, so virtual and loopback interfaces may be included unless filtered in code.

## Development notes

- Entry point: `src/index.js` (ES module)
- To run via an npm script, add a `start` script in `package.json`:

```json
"scripts": {
  "start": "node src/index.js"
}
```

## License

ISC
