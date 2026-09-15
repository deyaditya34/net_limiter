# net_limiter

net_limiter is a lightweight Linux network monitor written in Node.js. It reads raw byte counters from `/sys/class/net/*/statistics`, tracks per-interface and aggregate usage, and emits desktop notifications when daily usage crosses a configured MB threshold.

## Features

- Tracks total, daily, and per-interface download/upload bytes
- Filters to active Ethernet and Wi‑Fi interfaces only
- Calculates live speeds from byte deltas over time
- Saves persistent state to `state.json` so usage and notification checkpoints survive process restarts
- Appends daily summaries to `usage.jsonl` for later reporting
- Sends `notify-send` alerts when the configured usage threshold is reached

## Requirements

- Linux with `/sys/class/net` available
- Node.js 16 or newer
- `notify-send` installed and available in `PATH` for desktop notifications

## Installation

```bash
git clone https://github.com/<your-org>/net_limiter.git
cd net_limiter
npm install
```

Create a `.env` file in the project root:

```env
NOTIFY_MB=10
DATA_DIR=data
```

The runtime expects these variables to exist before startup; the app loads them from `src/config/env.js` using `dotenv`.

## Running

Start the monitor directly:

```bash
node src/index.js
```

This process runs continuously and polls the interface counters every second. It stores the current state and usage history under the configured `DATA_DIR` directory.

## How it works

- `src/index.js` starts the monitoring loop and loads existing state on startup
- `src/network/interfaces.js` enumerates interfaces and stores the last observed RX/TX counters
- `src/network/counters.js` reads byte totals from `/sys/class/net/<iface>/statistics/{rx_bytes,tx_bytes}`
- `src/network/usage.js` calculates deltas, updates accumulated daily totals, and tracks per-interface usage
- `src/monitoring/notification.js` sends a notification whenever `STATE.daily.download + STATE.daily.upload` exceeds the next threshold in MB
- `src/storage/state.js` writes the current monitor state to `state.json`
- `src/storage/usageHistory.js` appends JSON lines to `usage.jsonl` whenever a day boundary is reached

## State and output files

The project writes these files under `DATA_DIR`:

- `state.json` — persisted monitor state including totals, daily usage, and the last notification threshold
- `usage.jsonl` — daily usage snapshots, one JSON object per line
- `state.json.tmp` — temporary file used while saving state atomically

Example `state.json` shape:

```json
{
  "accumulated": 0,
  "totalDownload": 0,
  "totalUpload": 0,
  "daily": {
    "download": 0,
    "upload": 0,
    "interfaces": {},
    "lastNotifiedMb": 10
  },
  "trackingDate": "2026-09-15"
}
```

## Configuration

The live threshold is controlled by `NOTIFY_MB` in `.env`:

- `NOTIFY_MB` sets the usage step in MB for desktop notifications
- Each time the daily total exceeds the next notification threshold, the app sends a message and increments the next checkpoint

`DATA_DIR` is required and determines where the runtime creates and reads its state and usage files. Relative paths are resolved from the directory where the command is started.

## Troubleshooting

- If notifications do not appear, verify `notify-send` is installed and a notification daemon is active in your desktop session
- If no interfaces are tracked, confirm you are running on Linux and that `/sys/class/net` contains Ethernet or Wi‑Fi entries
- If the app stops updating, check the terminal logs for errors; the monitor catches and logs runtime failures and then re-initializes interfaces

## Notes

This project is intentionally minimal and is tuned for local monitoring on a Linux workstation. It is not a full daemon service manager or a cross-platform network tool.

## License

ISC
