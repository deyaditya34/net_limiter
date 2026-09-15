import { exec } from "child_process";
import { STATE } from "./monitor.js";
import {NOTIFY_MB} from "../config/env.js";

const ONE_MB = 1024 * 1024;
let displayUsage = 0;

export function sendNotification(message) {
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

export function checkNotification(currentDate) {
	const usedMb = Math.floor((STATE.daily.download + STATE.daily.upload) / ONE_MB);

	if (usedMb >= STATE.daily.lastNotifiedMb) {
		displayUsage = Number((usedMb / 1000).toFixed(4));

		sendNotification(`${displayUsage} GB used`);
		STATE.daily.lastNotifiedMb += NOTIFY_MB;
	}
}
