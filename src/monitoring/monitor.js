import { getCurrentDate } from "../utils/date.js";
import { appendUsage } from "../storage/usageHistory.js";
import { getCurrentNetworkUsage } from "../network/counters.js";
import {
	calculateInterfaceDelta,
	updateLastUsage,
	updateAccumulatedUsage,
	updateDailyUsage,
	updateTotalUsage
} from "../network/usage.js";
import { calculateSpeed } from "../network/speed.js";
import { checkNotification } from "./notification.js";
import { initialize } from "../network/interfaces.js";
import { MONITOR_INTERVAL_MS, NOTIFY_MB } from "../config/env.js";
import { saveState } from "../storage/state.js";
import { STATE } from "../state/state.js";

async function monitor() {
	try {
		let currentDate = getCurrentDate();
		const currentTime = performance.now();

		if (currentDate !== STATE.trackingDate) {
			await appendUsage(STATE.trackingDate, STATE.daily);
			STATE.trackingDate = currentDate;

			STATE.daily = {
				download: 0,
				upload: 0,
				interfaces: {},
				lastNotifiedMb: NOTIFY_MB
			}
		}

		const currentUsage = await getCurrentNetworkUsage();
		const interfaceDelta = calculateInterfaceDelta(currentUsage);
		updateLastUsage(currentUsage);
		updateAccumulatedUsage(interfaceDelta);
		updateDailyUsage(interfaceDelta, currentDate);
		updateTotalUsage(interfaceDelta);

		const elapsedSeconds = (currentTime - STATE.prevTime) / 1000;
		calculateSpeed(interfaceDelta, elapsedSeconds);
		checkNotification(currentDate);

		STATE.prevTime = currentTime;
	} catch (err) {
		console.log("err -", err);
		await initialize();
	}
}

export async function startMonitoring() {
	while (true) {
		try {
			await monitor();
			await saveState();
		} catch (err) {
			console.error(err);
		}

		await new Promise((resolve) => setTimeout(resolve, MONITOR_INTERVAL_MS));
	}
}
