import { ONE_GB } from "../config/constants.js";

export function sessionHandler(STATE) {
	return {
		startDate: STATE.session.startDate,
		download: `${Number(STATE.session.download / ONE_GB).toFixed(2)} GB`,
		upload: `${Number(STATE.session.upload / ONE_GB).toFixed(2)} GB`
	}
}
