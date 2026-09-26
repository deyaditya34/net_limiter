import { sessionHandler } from "./session.js";
import { ONE_GB } from "../config/constants.js";

export function statusHandler(STATE) {
	return {
		today: {
			date: STATE.trackingDate,
			download: `${(STATE.daily.download / ONE_GB).toFixed(2)} GB`,
			upload: `${(STATE.daily.upload / ONE_GB).toFixed(2)} GB`,
			total: `${((STATE.daily.download + STATE.daily.upload) / ONE_GB).toFixed(2)} GB`
		},
		speed: STATE.currentSpeed,
		session: sessionHandler(STATE),
		notification: {
			threshold: `${(STATE.notification.threshold / ONE_GB).toFixed(2)} GB`,
			enabled: STATE.notification.enabled
		}
	}
}
