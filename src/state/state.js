export const STATE = {
	accumulated: 0,
	totalDownload: 0,
	totalUpload: 0,
	daily: {},
	session: {}, // value is set from the updateSessionUsage() in monitoring engine
	trackingDate: null,
	prevTime: performance.now(),
	currentSpeed: "", // value matches with the return value of calculateSpeed() in monitoring engine
	limit: 0,
	limitStartDate: "",
	limitEndDate: ""
}
