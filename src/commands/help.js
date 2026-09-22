export function displayHelp() {
	return `
Usage:
	usage --days <number>			Show usage for the last N days
	usage --from <date> --to <date>	Show usage between two dates

Interface:
	interface --days <number>		Show interface usage for the last N days
	interface --from <date> --to <date>	Show interface usage between two dates

Monitoring:
	speed					Show current network speed
	session					Show current session usage
	status					Show current Net Limiter status

Limit:
	limit set --amount <GB> --days <number>	Set a usage limit for N days
	limit set --amount <GB> --from <date> --to <date>
						Set a usage limit for a date range
	limit get				Show current usage limit

Notification:
	notification enable			Enable usage notifications
	notification disable			Disable usage notifications
	notification --threshold <GB>		Set notification threshold

General:
	help					Show this help message
`;
}
