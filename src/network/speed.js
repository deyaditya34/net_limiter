export function calculateSpeed(interfaceDelta, elapsedSeconds) {
	const speed = {};

	for (const interfaceName of Object.keys(interfaceDelta)) {
		const { rxDelta, txDelta } = interfaceDelta[interfaceName];
		const downloadMbps = (rxDelta * 8) / elapsedSeconds / 1000000;
		const uploadMbps = (txDelta * 8) / elapsedSeconds / 1000000;

		speed[interfaceName] = {
			download: `${downloadMbps.toFixed(2)} Mbps`,
			upload: `${uploadMbps.toFixed(2)} Mbps`,
		}
	}

	console.log({ speed });
}
