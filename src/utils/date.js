export function getCurrentDate() {
	const NEW_DATE = new Date();
	return `${NEW_DATE.getFullYear()}-${String(NEW_DATE.getMonth() + 1).padStart(2, "0")}-${String(NEW_DATE.getDate()).padStart(2, "0")}`;
}

export function sanitizeDate(date) {
	const NEW_DATE = new Date(date);
	return `${NEW_DATE.getFullYear()}-${String(NEW_DATE.getMonth() + 1).padStart(2, "0")}-${String(NEW_DATE.getDate()).padStart(2, "0")}`;
}
