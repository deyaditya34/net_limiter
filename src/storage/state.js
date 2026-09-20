import { writeFile, rename, readFile } from "fs/promises";
import { STATE } from "../state/state.js";
import { getCurrentDate } from "../utils/date.js";
import { SAVE_STATE_FILE, SAVE_STATE_FILE_TEMP } from "../config/constants.js";

export async function saveState() {
	try {
		const SAVE_FILE_DATA = JSON.stringify(STATE);
		await writeFile(SAVE_STATE_FILE_TEMP, SAVE_FILE_DATA);
		await rename(SAVE_STATE_FILE_TEMP, SAVE_STATE_FILE);
	} catch (err) {
		throw new Error(err)
	}
}

export async function loadState() {
	try {
		const LOAD_FILE_DATA = await readFile(SAVE_STATE_FILE);
		const PARSED_FILE_DATA = JSON.parse(LOAD_FILE_DATA);
		STATE.trackingDate = PARSED_FILE_DATA.trackingDate ?? getCurrentDate();
		STATE.accumulated = PARSED_FILE_DATA.accumulated ?? 0;
		STATE.totalDownload = PARSED_FILE_DATA.totalDownload ?? 0;
		STATE.totalUpload = PARSED_FILE_DATA.totalUpload ?? 0;
		STATE.daily = PARSED_FILE_DATA.daily ?? {};
		STATE.limit = PARSED_FILE_DATA.limit ?? 0;
		STATE.limitStartDate = PARSED_FILE_DATA.limitStartDate ?? "";
		STATE.limitEndDate = PARSED_FILE_DATA.limitEndDate ?? "";
	} catch (err) {
		throw err;
	}
}
