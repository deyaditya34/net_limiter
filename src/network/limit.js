import { STATE } from "../state/state.js";
import { getUsageBetweenDates } from "../storage/usageHistory.js";
import { ONE_GB } from "../config/constants.js";

export async function getLimit() {
	const usage = await getUsageBetweenDates(STATE.limitStartDate, STATE.limitEndDate);
	const limit = STATE.limit;

	const limitInGB = STATE.limit / ONE_GB;
	const usedGb = usage.totalUsage / ONE_GB;
	const remaining = limitInGB - usedGb;
	const percentage = usedGb / limitInGB * 100;

	return {
		limit: `${limitInGB.toFixed(2)} GB`,
		usedGb: `${usedGb.toFixed(2)} GB`,
		remaining: `${remaining.toFixed(2)} GB`,
		percentage: `${percentage.toFixed(2)}%`,
	};
}

export function setLimit(startDate, endDate, limit) {
	STATE.limitStartDate = startDate;
	STATE.limitEndDate = endDate;
	STATE.limit = limit * ONE_GB;

	return `Limit set for '${limit} GB' from '${startDate}' to '${endDate}'`;
}
