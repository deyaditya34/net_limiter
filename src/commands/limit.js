import { getLimit, setLimit } from "../network/limit.js"
import { calculateDatesFromNoOfDays } from "../utils/date.js";

export async function limitHandler(subCommand, options) {
	if (subCommand === "set") {
		options = request.options;

		if (options.days !== undefined) {
			const { sanitizedStartDate, sanitizedEndDate } = calculateDatesFromNoOfDays(options.days, 1);
			return await setLimit(sanitizedStartDate, sanitizedEndDate, options.amount);
		} else {
			return await setLimit(options.from, options.to, options.amount);
		}
	}

	return await getLimit();
}
