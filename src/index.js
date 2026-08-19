import { readFile, readdir, writeFile } from "fs/promises";
import { exec } from "child_process";

const INTERFACE_LIST_PATH = "/sys/class/net";
const SAVE_STATE_FILE = "state.json";

const ONE_MB = 1024 * 1024;

let interfaces;
let lastRx = 0;
let lastTx = 0;
let accumulated = 0;
let notifiedMb = 10;
let threshold = notifiedMb;
let displayUsage = 0;
let daily = {};

function getCurrentDate() {
	const NEW_DATE = new Date();
	return `${NEW_DATE.getFullYear()}-${String(NEW_DATE.getMonth() + 1).padStart(2, "0")}-${String(NEW_DATE.getDate()).padStart(2, "0")}`;
}

async function loadState() {
	try {
		const LOAD_FILE_DATA = await readFile(SAVE_STATE_FILE);
		const PARSED_FILE_DATA = JSON.parse(LOAD_FILE_DATA);

		accumulated = PARSED_FILE_DATA.accumulated ?? 0;
		daily = PARSED_FILE_DATA.daily ?? {};
	} catch (err) {
		throw new Error(err);
	}
}

async function saveState() {
	try {
		const SAVE_FILE_DATA = JSON.stringify({
			lastRx,
			lastTx,
			accumulated,
			daily
		});

		await writeFile(SAVE_STATE_FILE, SAVE_FILE_DATA);
	} catch (err) {
		throw new Error(err.message)
	}
}

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

	lastRx = 0;
	lastTx = 0;
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

		let rxDelta = currentRx - lastRx;
		let txDelta = currentTx - lastTx;
		let networkDelta = rxDelta + txDelta;

		lastRx = currentRx;
		lastTx = currentTx;

		accumulated += networkDelta;

		const currentDate = getCurrentDate();
		if (daily[currentDate] === undefined) {
			daily[currentDate] = 0;
		}
		daily[currentDate] += accumulated;

		const usedMb = Math.floor(accumulated / ONE_MB);

		if (usedMb >= threshold) {
			displayUsage = Number((usedMb / 1000).toFixed(4));

			sendNotification(`${displayUsage} GB used`);
			threshold += notifiedMb;
		}
	} catch (err) {
		await initialize();
	}
}

await loadState();
await initialize();

setInterval(async () => {
	try {
		await monitor();
		await saveState();
	} catch (err) {
		sendNotification(err.message);
	}
}, 1000);


/**
process.on("SIGINT", saveState);
process.on("SIGTERM", saveState);
process.on("uncaughtException", async (err) => {
	sendNotification(err);
	await saveState();
	process.exit(0);
});
process.on("unhandledRejection", async (err) => {
	sendNotification(err);
	await saveState();
	process.exit(0);
});
*/
