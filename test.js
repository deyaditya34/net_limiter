import fs from "fs/promises";

const FILE = "usage.jsonl";

async function appendFile() {
	const file_data = await fs.readFile(FILE);
	const increase = 5000;
	const data = JSON.parse(file_data);
	const date = new Date(data.date);
	let download = data.download;
	let upload = data.upload;

	for (let i = 1; i < 365; i++) {
		date.setDate(date.getDate() + 1);
		download += 4 * increase;
		upload += 4 * increase;
		const writeData = {
			date,
			download, 
			upload, 
			interfaces: {
				eno1: {
					download: data.interfaces.eno1.download + (i * increase),
					upload: data.interfaces.eno1.upload + (i * increase),
					type: data.interfaces.eno1.type
				},
				wlan0: {
					download: data.interfaces.wlan0.download + (i * increase),
					upload: data.interfaces.wlan0.upload + (i * increase),
					type: data.interfaces.wlan0.type
				}
			},
			lastNotifiedMb: data.lastNotifiedMb
		}

		await fs.appendFile(FILE, JSON.stringify(writeData) + "\n")
	}
}

appendFile();
