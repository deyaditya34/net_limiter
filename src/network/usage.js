import { STATE } from "../state/state.js";
import { interfaceState } from "./interfaces.js";

export function calculateInterfaceDelta(currentUsage) {
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

export function updateLastUsage(currentUsage) {
	for (const interfaceName of Object.keys(currentUsage)) {
		interfaceState[interfaceName].lastRx = currentUsage[interfaceName].currentRx;
		interfaceState[interfaceName].lastTx = currentUsage[interfaceName].currentTx;
	}
}

export function updateAccumulatedUsage(interfaceDelta) {
	for (const interfaceName of Object.keys(interfaceDelta)) {
		const { rxDelta, txDelta } = interfaceDelta[interfaceName];
		STATE.accumulated += rxDelta + txDelta;
	}
};

export function updateDailyUsage(interfaceDelta) {
	if (Object.keys(STATE.daily).length <= 0) {
		STATE.daily = {
			download: 0,
			upload: 0,
			interfaces: {},
			lastNotifiedMb: STATE.notification.threshold
		};
	}

	for (const interfaceName of Object.keys(interfaceDelta)) {
		if (STATE.daily.interfaces[interfaceName] === undefined) {
			STATE.daily.interfaces[interfaceName] = {
				download: 0,
				upload: 0,
				type: interfaceState[interfaceName].type
			};
		}

		STATE.daily.interfaces[interfaceName].type = interfaceState[interfaceName].type;

		const { rxDelta, txDelta } = interfaceDelta[interfaceName];
		STATE.daily.download += rxDelta;
		STATE.daily.upload += txDelta;

		STATE.daily.interfaces[interfaceName].download += rxDelta;
		STATE.daily.interfaces[interfaceName].upload += txDelta;
	}
}

export function updateTotalUsage(interfaceDelta) {
	for (const interfaceName of Object.keys(interfaceDelta)) {
		const { rxDelta, txDelta } = interfaceDelta[interfaceName];

		STATE.totalDownload += rxDelta;
		STATE.totalUpload += txDelta;
	}
}

