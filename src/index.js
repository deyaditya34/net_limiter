import { readFile, readdir, writeFile, access, appendFile, rename } from "fs/promises";
import { createReadStream } from "fs";
import readline, { Interface } from "readline";
import { exec } from "child_process";

const INTERFACE_LIST_PATH = "/sys/class/net";
const SAVE_STATE_FILE = "state.json";
const SAVE_STATE_FILE_TEMP = "state.json.tmp";
const SAVE_USAGE_FILE = "usage.jsonl";

const ONE_MB = 1024 * 1024;

let accumulated = 0;
let totalDownload = 0;
let totalUpload = 0;
let notifiedMb = 10;
let displayUsage = 0;
let interfaceState = {};
let daily = {};
let lastNotifiedMb;
let trackingDate;

function getCurrentDate() {
	const NEW_DATE = new Date();
	return `${NEW_DATE.getFullYear()}-${String(NEW_DATE.getMonth() + 1).padStart(2, "0")}-${String(NEW_DATE.getDate()).padStart(2, "0")}`;
}

function sanitizeDate(date) {
	const NEW_DATE = new Date(date);
	return `${NEW_DATE.getFullYear()}-${String(NEW_DATE.getMonth() + 1).padStart(2, "0")}-${String(NEW_DATE.getDate()).padStart(2, "0")}`;
}

async function loadState() {
	try {
		const LOAD_FILE_DATA = await readFile(SAVE_STATE_FILE);
		const PARSED_FILE_DATA = JSON.parse(LOAD_FILE_DATA);

		trackingDate = PARSED_FILE_DATA.trackingDate ?? getCurrentDate();
		accumulated = PARSED_FILE_DATA.accumulated ?? 0;
		totalDownload = PARSED_FILE_DATA.totalDownload ?? 0;
		totalUpload = PARSED_FILE_DATA.totalUpload ?? 0;
		daily = PARSED_FILE_DATA.daily ?? {};
	} catch (err) {
		throw new Error(err);
	}
}

async function saveState() {
	try {
		const SAVE_FILE_DATA = JSON.stringify({
			trackingDate,
			totalDownload,
			totalUpload,
			accumulated,
			daily
		});
		await writeFile(SAVE_STATE_FILE_TEMP, SAVE_FILE_DATA);
		await rename(SAVE_STATE_FILE_TEMP, SAVE_STATE_FILE);
	} catch (err) {
		throw new Error(err)
	}
}

async function appendUsage(trackingDate, usage) {
	try {
		await appendFile(SAVE_USAGE_FILE,
			JSON.stringify({
				date: trackingDate,
				...usage
			}) + "\n"
		);
	} catch (err) {
		throw Error(err)
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
	const interfaces = await readdir(INTERFACE_LIST_PATH);

	interfaceState = {};

	for (const interfaceName of interfaces) {
		const interfaceType = await getInterfaceType(interfaceName);
		if (interfaceType === "ethernet" || interfaceType === "wifi") {
			interfaceState[interfaceName] = {
				type: interfaceType,
				lastRx: await readBytes(interfaceName, "rx_bytes"),
				lastTx: await readBytes(interfaceName, "tx_bytes")
			}
		}
	}
}

async function getCurrentNetworkUsage() {
	const currentUsage = {};

	for (const interfaceName of Object.keys(interfaceState)) {
		currentUsage[interfaceName] = {
			currentRx: await readBytes(interfaceName, "rx_bytes"),
			currentTx: await readBytes(interfaceName, "tx_bytes"),
		}
	}
	return currentUsage;
}

function calculateInterfaceDelta(currentUsage) {
	const interfaceDelta = {};

	for (const interfaceName of Object.keys(currentUsage)) {
		const currentRx = currentUsage[interfaceName].currentRx;
		const currentTx = currentUsage[interfaceName].currentTx;

		const lastRx = interfaceState[interfaceName].lastRx;
		const lastTx = interfaceState[interfaceName].lastTx;

		const rxDelta = currentRx - lastRx;
		const txDelta = currentTx - lastTx;

		interfaceDelta[interfaceName] = {
			rxDelta,
			txDelta,
		}
	}

	return interfaceDelta;
}

function updateLastUsage(currentUsage) {
	for (const interfaceName of Object.keys(currentUsage)) {
		interfaceState[interfaceName].lastRx = currentUsage[interfaceName].currentRx;
		interfaceState[interfaceName].lastTx = currentUsage[interfaceName].currentTx;
	}
}

function updateAccumulatedUsage(interfaceDelta) {
	for (const interfaceName of Object.keys(interfaceDelta)) {
		const { rxDelta, txDelta } = interfaceDelta[interfaceName];
		accumulated += rxDelta + txDelta;
	}
};

function updateDailyUsage(interfaceDelta) {
	if (Object.keys(daily).length <= 0) {
		daily = {
			download: 0,
			upload: 0,
			interfaces: {},
			lastNotifiedMb: notifiedMb
		};
	}

	for (const interfaceName of Object.keys(interfaceDelta)) {
		if (daily.interfaces[interfaceName] === undefined) {
			daily.interfaces[interfaceName] = {
				download: 0,
				upload: 0,
				type: interfaceState[interfaceName].type
			};
		}

		daily.interfaces[interfaceName].type = interfaceState[interfaceName].type;

		const { rxDelta, txDelta } = interfaceDelta[interfaceName];
		daily.download += rxDelta;
		daily.upload += txDelta;

		daily.interfaces[interfaceName].download += rxDelta;
		daily.interfaces[interfaceName].upload += txDelta;
	}
}

function updateTotalUsage(interfaceDelta) {
	for (const interfaceName of Object.keys(interfaceDelta)) {
		const { rxDelta, txDelta } = interfaceDelta[interfaceName];

		totalDownload += rxDelta;
		totalUpload += txDelta;
	}
}

function checkNotification(currentDate) {
	const usedMb = Math.floor((daily.download + daily.upload) / ONE_MB);

	if (usedMb >= daily.lastNotifiedMb) {
		displayUsage = Number((usedMb / 1000).toFixed(4));

		sendNotification(`${displayUsage} GB used`);

		daily.lastNotifiedMb += notifiedMb;
	}
}

async function monitor() {
	try {
		let currentDate = getCurrentDate();
		const currentTime = performance.now();

		if (currentDate !== trackingDate) {
			await appendUsage(trackingDate, daily);
			trackingDate = currentDate;

			daily = {
				download: 0,
				upload: 0,
				interfaces: {},
				lastNotifiedMb: notifiedMb
			}
		}

		const currentUsage = await getCurrentNetworkUsage();
		const interfaceDelta = calculateInterfaceDelta(currentUsage);
		updateLastUsage(currentUsage);
		updateAccumulatedUsage(interfaceDelta);
		updateDailyUsage(interfaceDelta, currentDate);
		updateTotalUsage(interfaceDelta);

		const elapsedSeconds = (currentTime - prevTime) / 1000;
		calculateSpeed(interfaceDelta, elapsedSeconds);
		checkNotification(currentDate);

		prevTime = currentTime;
	} catch (err) {
		console.log("err -", err);
		await initialize();
	}
}

async function getInterfaceType(interfaceName) {
	const interfacePath = `/sys/class/net/${interfaceName}`;

	try {
		await access(`${interfacePath}/wireless`);
		return "wifi";
	} catch (err) {
	}

	try {
		await access(`${interfacePath}/device`);
		return "ethernet";
	} catch (err) {
	}

	return "other";
}

async function getUsageSummary(noOfDays) {
	const endDate = new Date(getCurrentDate());

	const startDate = new Date(endDate);
	startDate.setDate(endDate.getDate() - (noOfDays - 1));

	let totalUsage = 0;
	let totalDownload = 0;
	let totalUpload = 0;
	let wifiDownload = 0;
	let wifiUpload = 0;
	let ethernetDownload = 0;
	let ethernetUpload = 0;

	for (let i = 0; i < noOfDays; i++) {
		let date = new Date(endDate);
		date.setDate(endDate.getDate() - i);

		const sanitizedDate = sanitizeDate(date);
		if (daily[sanitizedDate] !== undefined) {
			totalUsage += daily[sanitizedDate].download;
			totalUsage += daily[sanitizedDate].upload;

			totalDownload += daily[sanitizedDate].download;
			totalUpload += daily[sanitizedDate].upload;

			for (const interfaceData of Object.values(daily[sanitizedDate].interfaces)) {

				if (interfaceData.type === "ethernet") {
					ethernetDownload += interfaceData.download;
					ethernetUpload += interfaceData.upload;
				}

				else if (interfaceData.type === "wifi") {
					wifiDownload += interfaceData.download;
					wifiUpload += interfaceData.upload;
				}
			}
		}
	}

	return {
		totalUsage,
		totalDownload,
		totalUpload,
		wifiDownload,
		wifiUpload,
		ethernetDownload,
		ethernetUpload
	};
}

async function calculateLimitStatus(usage, limit) {
	const usedGb = Number(usage.totalUsage / ONE_MB / 1000).toFixed(2);
	const remaining = Number(limit - usedGb).toFixed(2);
	const percentage = Number(usedGb / limit * 100).toFixed(2);

	console.log({
		usedGb: `${usedGb} GB`,
		remaining: `${remaining} GB`,
		percentage: `${percentage}%`,
	});
}

function calculateSpeed(interfaceDelta, elapsedSeconds) {
	const speed = {};

	for (const interfaceName of Object.keys(interfaceDelta)) {
		const { rxDelta, txDelta } = interfaceDelta[interfaceName];
		const downloadMbps = (rxDelta * 8) / elapsedSeconds / 1000000;
		const uploadMbps = (txDelta * 8) / elapsedSeconds / 1000000;

		speed[interfaceName] = {
			download: `${downloadMbps.toFixed(2)} Mbps`,
			upload: `${uploadMbps.toFixed(2)} Mbps`,
		}
	}

	console.log({ speed });
}

async function getUsageBetweenDatesInGB(startDate, endDate, filePath = SAVE_USAGE_FILE) {
	const result = {
		totalUsage: 0,
		totalDownload: 0,
		totalUpload: 0,
		wifiDownload: 0,
		wifiUpload: 0,
		ethernetDownload: 0,
		ethernetUpload: 0
	}

	const readStream = createReadStream(filePath, { encoding: "utf8" });
	const rl = readline.createInterface({ input: readStream, crlfDelay: Infinity });

	for await (const line of rl) {
		if (line.trim() === "") {
			continue;
		}

		const parsedLine = JSON.parse(line);
		if (startDate <= parsedLine.date && endDate <= parsedLine.date) {
			result.totalDownload += parsedLine.download;
			result.totalUpload += parsedLine.upload;

			for (const interfaceData of Object.values(parsedLine.interfaces)) {
				if (interfaceData.type === "ethernet") {
					result.ethernetDownload += interfaceData.download;
					result.ethernetUpload += interfaceData.upload;
				}

				if (interfaceData.type === "wifi") {
					result.wifiDownload += interfaceData.download;
					result.wifiUpload += interfaceData.upload;
				}
			}
		}
	}

	result.totalUsage += result.totalDownload + result.totalUpload;
	
	for (const usage of Object.keys(result)) {
		result[usage] = result[usage] / 1000000000; 
	}

	return result;
}

async function start() {
	while (true) {
		try {
			await monitor();
			await saveState();
		} catch (err) {
			console.error(err);
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
	}
}

await loadState();
await initialize();
let prevTime = performance.now();
readJsonl("2026-09-01", "2026-09-05");
//start();
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
