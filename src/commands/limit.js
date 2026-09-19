export async function calculateLimit(usage, limit) {
	const usedGb = Number(usage.totalUsage / ONE_MB / 1000).toFixed(2);
	const remaining = Number(limit - usedGb).toFixed(2);
	const percentage = Number(usedGb / limit * 100).toFixed(2);

	console.log({
		usedGb: `${usedGb} GB`,
		remaining: `${remaining} GB`,
		percentage: `${percentage}%`,
	});
}
