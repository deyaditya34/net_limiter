import { appendFile } from "fs/promises";
import { createReadStream } from "fs";
import readline from "readline";
import { getCurrentDate, sanitizeDate } from "../utils/date.js";
import {SAVE_USAGE_FILE} from "../config/constants.js";

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
	const endDate = new Date(getCurrentDate());

	const startDate = new Date(endDate);
	startDate.setDate(endDate.getDate() - (noOfDays - 1));

	const sanitizedStartDate = sanitizeDate(startDate);
	const sanitizedEndDate = sanitizeDate(endDate);

	const result = await getUsageBetweenDatesInGB(sanitizedStartDate, sanitizedEndDate);

	console.log(result);
}

export async function getUsageBetweenDatesInGB(startDate, endDate, filePath = SAVE_USAGE_FILE) {
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
