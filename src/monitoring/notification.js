import { exec } from "child_process";
import { STATE } from "../state/state.js";
import { ONE_GB } from "../config/constants.js";

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
	const usedBytes = STATE.daily.download + STATE.daily.upload;

	if (usedBytes >= STATE.daily.lastNotifiedMb) {
		let displayUsage = Number((usedBytes / ONE_GB).toFixed(4));

		sendNotification(`${displayUsage} GB used`);
		STATE.daily.lastNotifiedMb += STATE.notification.threshold;
	}
}
