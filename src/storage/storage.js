import { readdir, mkdir, access, writeFile } from "fs/promises";

import { DATA_DIR } from "../config/env.js";
import { SAVE_STATE_FILE, SAVE_USAGE_FILE } from "../config/constants.js";

export async function initializeStorage() {
	try {
		await readdir(DATA_DIR);
	} catch (err) {
		await mkdir(DATA_DIR);
	}

	try {
		await access(SAVE_STATE_FILE);
	} catch (err) {
		await writeFile(SAVE_STATE_FILE, JSON.stringify({}));
	}
	try {
		await access(SAVE_USAGE_FILE);
	} catch (err) {
		await writeFile(SAVE_USAGE_FILE, "");
	}
}
