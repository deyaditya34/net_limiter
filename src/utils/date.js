export function getCurrentDate() {
	const NEW_DATE = new Date();
	return `${NEW_DATE.getFullYear()}-${String(NEW_DATE.getMonth() + 1).padStart(2, "0")}-${String(NEW_DATE.getDate()).padStart(2, "0")}`;
}

export function sanitizeDate(date) {
	const NEW_DATE = new Date(date);
	return `${NEW_DATE.getFullYear()}-${String(NEW_DATE.getMonth() + 1).padStart(2, "0")}-${String(NEW_DATE.getDate()).padStart(2, "0")}`;
}

export function calculateDatesFromNoOfDays(noOfDays, direction) {
	let startDate;
	let endDate;
	let sanitizedStartDate;
	let sanitizedEndDate;

	if (direction === 1) {
		startDate = new Date(getCurrentDate());
		endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + (noOfDays - 1));

		sanitizedStartDate = sanitizeDate(startDate);
		sanitizedEndDate = sanitizeDate(endDate);
	} else if (direction === -1) {
		endDate = new Date(getCurrentDate());
		startDate = new Date(endDate);
		startDate.setDate(startDate.getDate() - (noOfDays - 1));

		sanitizedStartDate = sanitizeDate(startDate);
		sanitizedEndDate = sanitizeDate(endDate);
	}

	return { sanitizedStartDate, sanitizedEndDate }
}
