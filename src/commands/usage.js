import readline from "readline";
import { createReadStream } from "fs";

import { sanitizeDate } from "../utils/date.js";
import { STATE } from "../state/state.js";
import { getCurrentDate } from "../utils/date.js";
//import { SAVE_USAGE_FILE } from "../config/constants.js";
const SAVE_USAGE_FILE = "/home/aditya/program/probe/net_limiter/data/usage.jsonl";

export async function getUsageSummary(noOfDays, daily = STATE.daily) {
	const endDate = new Date(getCurrentDate());

	const startDate = new Date(endDate);
	startDate.setDate(endDate.getDate() - (noOfDays - 1));

	const sanitizedStartDate = sanitizeDate(startDate);
	const sanitizedEndDate = sanitizeDate(endDate);

	const result = await getUsageBetweenDates(sanitizedStartDate, sanitizedEndDate);
	return result;
}

export async function getUsageBetweenDates(startDate, endDate, filePath = SAVE_USAGE_FILE) {
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
		if (startDate <= parsedLine.date && endDate >= parsedLine.date) {
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
		result[usage] = `${Number(result[usage] / 1000000000).toFixed(2)} GB`;
	}

	return result;
}
