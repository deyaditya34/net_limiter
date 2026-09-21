export const STATE = {
	accumulated: 0,
	totalDownload: 0,
	totalUpload: 0,
	notification: {
		threshold: 1000000000,
		enabled: true
	},
	daily: {},
	session: {}, // value is set from the updateSessionUsage() in monitoring engine
	trackingDate: null,
	prevTime: performance.now(),
	currentSpeed: "", // value matches with the return value of calculateSpeed() in monitoring engine
	limit: 0,
	limitStartDate: "",
	limitEndDate: ""
}
