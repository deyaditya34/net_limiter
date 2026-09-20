import { STATE } from "../state/state.js";
import { getUsageBetweenDates } from "../storage/usageHistory.js";

const ONE_MB = 1024 * 1024;
export async function getLimit() {
	const usage = await getUsageBetweenDates(STATE.limitStartDate, STATE.limitEndDate);
	const limit = STATE.limit;

	const usedGb = Number(usage.totalUsage / ONE_MB / 1000).toFixed(2);
	const remaining = Number(limit - usedGb).toFixed(2);
	const percentage = Number(usedGb / limit * 100).toFixed(2);

	return {
		usedGb: `${usedGb} GB`,
		remaining: `${remaining} GB`,
		percentage: `${percentage}%`,
	};
}

export function setLimit(startDate, endDate, limit) {
	STATE.limitStartDate = startDate;
	STATE.limitEndDate = endDate;
	STATE.limit = limit;

	return `Limit set for '${limit} GB' from '${startDate}' to '${endDate}'`;
}
