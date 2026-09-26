import { STATE } from "../state/state.js";

export function updateSessionUsage(interfaceDelta) {
	if (Object.keys(STATE.session).length <= 0) {
		STATE.session = {
			startDate: STATE.trackingDate,
			download: 0,
			upload: 0
		}
	}

	for (const interfaceName of Object.keys(interfaceDelta)) {
		const { rxDelta, txDelta } = interfaceDelta[interfaceName];

		STATE.session.download += rxDelta;
		STATE.session.upload += txDelta;
	}
}

