import { readFile } from "fs/promises";
import { exec } from "child_process";

const INTERFACES = ["eno1", "wlan0"];

const ONE_MB = 1024 * 1024;

let lastRx = 0;
let lastTx = 0;
let accumulated = 0;
let notifiedMb = 100;
let threshold = notifiedMb;

async function readBytes(INTERFACE, file) {
	const value = await readFile(`/sys/class/net/${INTERFACE}/statistics/${file}`, "utf8");
	return Number(value.trim());
}

function sendNotification(message) {
	exec(`notify-send "Internet Usage" "${message}"`, (error, stdout, stderr) => {
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
	lastRx = await readBytes(INTERFACES[0], "rx_bytes");
	lastTx = await readBytes(INTERFACES[0], "tx_bytes");

	lastRx += await readBytes(INTERFACES[1], "rx_bytes");
	lastTx += await readBytes(INTERFACES[1], "tx_bytes");
}

async function monitor() {
	let currentRx = await readBytes(INTERFACES[0], "rx_bytes");
	let currentTx = await readBytes(INTERFACES[0], "tx_bytes");

	currentRx += await readBytes(INTERFACES[1], "rx_bytes");
	currentTx += await readBytes(INTERFACES[1], "tx_bytes");

	const rxDelta = currentRx - lastRx;
	const txDelta = currentTx - lastTx;

	lastRx = currentRx;
	lastTx = currentTx;

	accumulated += rxDelta + txDelta;

	const usedMb = Math.floor(accumulated / ONE_MB);

	if (usedMb >= threshold) {
		sendNotification(`${usedMb} MB used`);
		threshold += notifiedMb;
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
