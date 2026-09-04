import { readFile, readdir, writeFile, access } from "fs/promises";
import { exec } from "child_process";

const INTERFACE_LIST_PATH = "/sys/class/net";
const SAVE_STATE_FILE = "state.json";

const ONE_MB = 1024 * 1024;

let accumulated = 0;
let totalDownload = 0;
let totalUpload = 0;
let notifiedMb = 10;
let threshold;
let displayUsage = 0;
let interfaceState = {};
let daily = {};
let lastNotifiedMb = {};

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

		accumulated = PARSED_FILE_DATA.accumulated ?? 0;
		daily = PARSED_FILE_DATA.daily ?? {};
		lastNotifiedMb = PARSED_FILE_DATA.lastNotifiedMb ?? {};
		totalDownload = PARSED_FILE_DATA.totalDownload ?? 0;
		totalUpload = PARSED_FILE_DATA.totalUpload ?? 0;
	} catch (err) {
		throw new Error(err);
	}
}

async function saveState() {
	try {
		const SAVE_FILE_DATA = JSON.stringify({
			totalDownload,
			totalUpload,
			accumulated,
			daily,
			lastNotifiedMb
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
	let interfaces = await readdir(INTERFACE_LIST_PATH);

	interfaceState = {};

	for (const interfaceName of interfaces) {
		const interfaceType = await getInterfaceType(interfaceName);
		if (interfaceType === "ethernet" || interfaceType === "wifi") {
			interfaceState[interfaceName] = {
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

function calculateDelta(currentUsage) {
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

async function updateDailyUsage(interfaceDelta, currentDate) {
	if (daily[currentDate] === undefined) {
		daily[currentDate] = {
			download: 0,
			upload: 0,
			interfaces: {}
		};
	}

	for (const interfaceName of Object.keys(interfaceDelta)) {
		if (daily[currentDate].interfaces[interfaceName] === undefined) {
			daily[currentDate].interfaces[interfaceName] = {
				download: 0,
				upload: 0,
			};
		}

		const interfaceType = await getInterfaceType(interfaceName);
		daily[currentDate].interfaces[interfaceName].type = interfaceType;

		const { rxDelta, txDelta } = interfaceDelta[interfaceName];
		daily[currentDate].download += rxDelta;
		daily[currentDate].upload += txDelta;

		daily[currentDate].interfaces[interfaceName].download += rxDelta;
		daily[currentDate].interfaces[interfaceName].upload += txDelta;
	}
}

function updateTotalUsage(interfaceDelta) {
	for (const interfaceName of Object.keys(interfaceDelta)) {
		const { rxDelta, txDelta } = interfaceDelta[interfaceName];

		totalDownload += rxDelta;
		totalUpload += txDelta;
	}
}

function updateDailyThreshold(currentDate) {
	if (lastNotifiedMb[currentDate] === undefined) {
		lastNotifiedMb[currentDate] = notifiedMb;
	}
	threshold = lastNotifiedMb[currentDate]
}

function checkNotification(currentDate) {
	const usedMb = Math.floor((daily[currentDate].download + daily[currentDate].upload) / ONE_MB);

	if (usedMb >= threshold) {
		displayUsage = Number((usedMb / 1000).toFixed(4));

		sendNotification(`${displayUsage} GB used`);
		threshold += notifiedMb;
		lastNotifiedMb[currentDate] = threshold;
	}
}

async function monitor() {
	try {
		let currentDate = getCurrentDate();

		const currentUsage = await getCurrentNetworkUsage();

		const interfaceDelta = calculateDelta(currentUsage);

		updateLastUsage(currentUsage);

		updateAccumulatedUsage(interfaceDelta);

		updateDailyUsage(interfaceDelta, currentDate);

		updateTotalUsage(interfaceDelta);

		updateDailyThreshold(currentDate);
		calculateSpeed(interfaceDelta);
		checkNotification(currentDate);
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

async function getUsageBetweenDates(startDate, endDate) {
	let totalUsage = 0;
	let totalDownload = 0;
	let totalUpload = 0;
	let wifiDownload = 0;
	let wifiUpload = 0;
	let ethernetDownload = 0;
	let ethernetUpload = 0;

	let currentDate = new Date(startDate);
	let finalDate = new Date(endDate);

	while (currentDate <= finalDate) {
		const sanitizedDate = sanitizeDate(currentDate);

		if (daily[sanitizedDate] !== undefined) {
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

		currentDate.setDate(currentDate.getDate() + 1);
	}

	totalUsage = totalDownload + totalUpload;

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

function calculateSpeed(interfaceDelta) {
	const speed = {};

	for (const interfaceName of Object.keys(interfaceDelta)) {
		const { rxDelta, txDelta } = interfaceDelta[interfaceName];

		const downloadMbps = rxDelta * 8 / 1000000;
		const uploadMbps = txDelta * 8 / 1000000;

		speed[interfaceName] = {
			download: `${downloadMbps.toFixed(2)} Mbps`,
			upload: `${uploadMbps.toFixed(2)} Mbps`,
		}
	}

	console.log({ speed });
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
