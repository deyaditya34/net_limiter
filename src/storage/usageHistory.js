import readline from "readline";
import { createReadStream } from "fs";
import { appendFile } from "fs/promises";
import { STATE } from "../state/state.js";
import { calculateDatesFromNoOfDays } from "../utils/date.js";
import { SAVE_USAGE_FILE } from "../config/constants.js";

export async function appendUsage(trackingDate, usage) {
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

export async function getUsageSummary(noOfDays) {

	const { sanitizedStartDate, sanitizedEndDate } = calculateDatesFromNoOfDays(noOfDays, -1);

	const result = await getUsageBetweenDates(sanitizedStartDate, sanitizedEndDate);
	return result;
}

export async function getUsageBetweenDates(startDate, endDate, filePath = SAVE_USAGE_FILE) {
	const result = {
		totalUsage: 0,
		totalDownload: 0,
		totalUpload: 0,
		wifiUsage: 0,
		wifiDownload: 0,
		wifiUpload: 0,
		ethernetUsage: 0,
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

	result.wifiUsage += result.wifiDownload + result.wifiUpload;
	result.ethernetUsage += result.ethernetDownload + result.ethernetUpload;
	result.totalUsage += result.totalDownload + result.totalUpload;

	return result;
}

export function formatUsage(usage) {
let result = {};

	for (const field of Object.keys(usage)) {
		result[field] = `${Number(usage[field] / 100000000).toFixed(2)} GB`;
	}

	return result;
}
