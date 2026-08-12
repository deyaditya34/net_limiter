# net_limiter

`net_limiter` is a lightweight Linux utility written in Node.js. It monitors the network usage reported by `/sys/class/net/*/statistics` and sends desktop notifications when the total data usage threshold is reached.

## Features

- Reads Linux network statistics from `/sys/class/net/<iface>/statistics/rx_bytes` and `tx_bytes`
- Aggregates RX + TX traffic across all detected network interfaces
- Sends desktop notifications via `notify-send`
- Checks usage every second
- Alerts after each additional 10 MB of data usage

## Requirements

- Node.js 16 or newer
- Linux system with `/sys/class/net` available
- `notify-send` installed and accessible from the PATH

## Install

No external npm dependencies are required for this project.

```bash
git clone https://github.com/<your-org>/net_limiter.git
cd net_limiter
npm install
```

## Usage

Run the monitor with Node.js:

```bash
node index.js
```

The script will initialize counters from all detected interfaces and then poll network usage once per second.

## Behavior

- The script computes the delta of received and transmitted bytes since the last check.
- It accumulates usage across all interfaces under `/sys/class/net`.
- When the total crosses the next 10 MB threshold, it sends a notification.
- The threshold increments by 10 MB after each notification.

## Customization

The project currently does not expose runtime configuration options. To change behavior, edit `index.js`:

- `ONE_MB` defines the byte unit for reporting
- `notifiedMb` sets the notification interval in MB
- `INTERFACE_LIST_PATH` is the location scanned for interfaces

## Limitations

- No persistence across script restarts; usage resets on launch
- Notifications require `notify-send`
- It does not distinguish traffic by interface or application
- It reads all interfaces detected in `/sys/class/net`, including virtual interfaces

## License

ISC
