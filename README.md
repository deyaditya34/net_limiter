# net_limiter

`net_limiter` is a small Node.js utility for Linux that monitors network traffic on configured interfaces and sends desktop notifications when a usage threshold is exceeded.

## Features

- Reads Linux network statistics from `/sys/class/net/*/statistics`
- Tracks combined RX and TX usage for multiple interfaces
- Sends notifications via `notify-send`
- Alerts every 100 MB by default

## Requirements

- Node.js 16+ (or any version supporting ES modules)
- Linux system with `/sys/class/net/<interface>/statistics/rx_bytes` and `tx_bytes`
- `notify-send` installed and available on the PATH

## Setup

1. Clone or download the repository.
2. Install dependencies (if you later add any packages):

```bash
npm install
```

## Usage

Run the monitoring script with Node.js:

```bash
node index.js
```

The script checks network usage every second and sends a notification when total data usage grows by 100 MB.

## Configuration

The monitored interfaces are defined in `index.js`:

```js
const INTERFACES = ["eno1", "wlan0"];
```

Update these values to match the network interfaces on your system.

## Notes

- The script currently aggregates traffic from both configured interfaces.
- If `notify-send` is not available, desktop alerts will not work.
- The current implementation does not persist usage state across restarts.

## License

ISC
