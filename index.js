import { readFile, readdir } from "fs/promises";
import { exec } from "child_process";

const INTERFACE_LIST_PATH = "/sys/class/net";

const ONE_MB = 1024 * 1024;

let interfaces;
let lastRx = 0;
let lastTx = 0;
let accumulated = 0;
let notifiedMb = 10;
let threshold = notifiedMb;
let displayUsage = 0;

async function readBytes(INTERFACE, file) {
	const value = await readFile(`/sys/class/net/${INTERFACE}/statistics/${file}`, "utf8");
	return Number(value.trim());
}

function sendNotification(message) {
	exec(`notify-send "Internet Usage" "${message}" -t 3000`, (error, stdout, stderr) => {
		if (error) {
			console.error("Error:", error);
		}

		if (stderr) {
			console.error("stderr:", stderr);
		}

		if (stdout) {
			console.log("stdout:", stdout);
		}
	});
}

async function initialize() {
	interfaces = await readdir(INTERFACE_LIST_PATH);
	for (const interfaceName of interfaces) {
		lastRx += await readBytes(interfaceName, "rx_bytes");
		lastTx += await readBytes(interfaceName, "tx_bytes");
	}
}

async function monitor() {
	let currentRx = 0;
	let currentTx = 0;

	try {
		for (const interfaceName of interfaces) {
			currentRx += await readBytes(interfaceName, "rx_bytes");
			currentTx += await readBytes(interfaceName, "tx_bytes");
		}

		const rxDelta = currentRx - lastRx;
		const txDelta = currentTx - lastTx;

		lastRx = currentRx;
		lastTx = currentTx;

		accumulated += rxDelta + txDelta;

		const usedMb = Math.floor(accumulated / ONE_MB);

		if (usedMb >= threshold) {
			displayUsage = Number((usedMb / 1000).toExponential(1));

			sendNotification(`${displayUsage} GB used`);
			threshold += notifiedMb;
		}
	} catch (err) {
		await initialize();
	}
}

await initialize();

setInterval(async () => {
	try {
		await monitor();
	} catch (err) {
		sendNotification(err.message);
	}
}, 1000);
