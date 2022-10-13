
function escapeArguments(str) {
	str = str.replace(/\\/g, "\\\\")
		.replace(/\$/g, "\\$")
		.replace(/'/g, "\\'")
		.replace(/"/g, "\\\"");
	return str;
}

function isNumeric(str) {
	if (/[^0-9]/.test(str)) {
		return false;
	}
	return true;
}

function httpsFetchPromise(address) {
	return new Promise((resolve, reject) => {
		//Single HTTPS-GET should get us everything we need

		https.get(address, (res) => {

			let ok = false;
			switch (res.statusCode) {
				default:
					ok = true;
					break;

				case 400:
					log("[" + address + "] ==> Malformed request ?! 400 - doing nothing.", "WW");
					break;

				case 403:
					log("[" + address + "] ==> Access forbidden ?! 403 - doing nothing.", "WW");
					break;

				case 404:
					log("[" + address + "] ==> Server not found ?! 404 - doing nothing.", "WW");
					break;

				case 500:
					log("[" + address + "] ==> Server error ?! 500 - doing nothing.", "WW");
					break;

				case 504:
					log("[" + address + "] ==> Server error ?! 504 - doing nothing.", "WW");
					break;
			}

			if (ok) {

				let d = '';

				res.setEncoding('utf8');

				res.on('readable', function () {
					const chunk = this.read() || '';

					d += chunk;
				});

				res.on('end', function () {
					resolve(d);
				});

			}
			else {
				reject(res.statusCode);
			}

		}).on('error', (e) => {
			reject(e);
		});
	})
}

async function fetchMapPromise(mapNameOrId, apiUrl) {

	let filter = 'displayName=="' + mapNameOrId + '"';
	if (isNumeric(mapNameOrId) && !isNaN(parseFloat(mapNameOrId))) {
		filter = 'id==' + mapNameOrId + '';
	}
	const fetchUrl = apiUrl + 'map?filter=' + filter + '&page[size]=1&include=versions,author';

	try {
		var d = await httpsFetchPromise(fetchUrl);
	} catch (error) {
		reject(error);
	}

	return new Promise((resolve, reject) => {

	let filter = 'displayName=="' + mapNameOrId + '"';
	if (isNumeric(mapNameOrId) && !isNaN(parseFloat(mapNameOrId))) {
		filter = 'id==' + mapNameOrId + '';
	}

		const data = JSON.parse(d);
		if (data != undefined && data.included != undefined) {

			let map = {};
			map.author = "Unknown";

			const mapData = data.data[0];
			const includes = data.included;

			for (let i = 0; i < includes.length; i++) {
				let thisData = includes[i];
				switch (thisData.type) {
					default:
						continue;
						break;

					case "mapVersion":
						map.imgUrl = thisData.attributes.thumbnailUrlLarge.replace(/( )/g, "%20");
						map.version = thisData.attributes.version;
						map.size = ((thisData.attributes.width / 512) * 10) + "x" + ((thisData.attributes.height / 512) * 10) + " km";
						map.description = thisData.attributes.description.replace(/<\/?[^>]+(>|$)/g, "");;
						map.downloadUrl = thisData.attributes.downloadUrl;
						map.maxPlayers = thisData.attributes.maxPlayers;
						map.ranked = thisData.attributes.ranked;
						break;

					case "player":
						map.author = thisData.attributes.login;
						break;
				}
			}

			map.id = mapData.id;
			map.displayName = mapData.attributes.displayName;
			map.createTime = mapData.attributes.createTime;

			let embedMes = {
				title: "" + map.displayName + " (id #" + map.id + ")",
				description: map.description,
				color: 0x0099FF,
				image: {
					url: map.imgUrl
				},
				fields: [
					{
						name: "Size",
						value: map.size,
						inline: true
					},
					{
						name: "Max players",
						value: map.maxPlayers,
						inline: true
					},
					{
						name: "Ranked",
						value: map.ranked,
						inline: true
					},
					{
						name: "Author",
						value: map.author,
						inline: true
					}
				]
			}

			if (map.downloadUrl != undefined) {
				embedMes.url = map.downloadUrl.replace(/ /g, "%20");
			}

			resolve(embedMes);

		}
		else {
			reject("Uknown map");
		}

});

function httpsFetch(address, function_callback) {

			//Single HTTPS-GET should get us everything we need

			https.get(address, (res) => {

				let ok = false;
				switch (res.statusCode) {
					default:
						ok = true;
						break;

					case 400:
						log("[" + address + "] ==> Malformed request ?! 400 - doing nothing.", "WW");
						break;

					case 403:
						log("[" + address + "] ==> Access forbidden ?! 403 - doing nothing.", "WW");
						break;

					case 404:
						log("[" + address + "] ==> Server not found ?! 404 - doing nothing.", "WW");
						break;

					case 500:
						log("[" + address + "] ==> Server error ?! 500 - doing nothing.", "WW");
						break;

					case 504:
						log("[" + address + "] ==> Server error ?! 504 - doing nothing.", "WW");
						break;
				}

				if (ok) {

					let d = '';

					res.setEncoding('utf8');

					res.on('readable', function () {
						const chunk = this.read() || '';

						d += chunk;
					});

					res.on('end', function () { function_callback(d); });

				}
				else {
					function_callback(res.statusCode);
				}

			}).on('error', (e) => {
				log("HTTPS request returned following error : [" + (e) + "]. Doing nothing.", "WW");
			});
		}

function fetchMap(mapNameOrId, apiUrl, callback) {

	let filter = 'displayName=="' + mapNameOrId + '"';
	if (isNumeric(mapNameOrId) && !isNaN(parseFloat(mapNameOrId))) {
		filter = 'id==' + mapNameOrId + '';
	}
	const fetchUrl = apiUrl + 'map?filter=' + filter + '&page[size]=1&include=versions,author';

	httpsFetch(fetchUrl, function (d) {
		if (Number.isInteger(d)) {
			callback("Server returned the error `" + d + "`.");
			return;
		}

		const data = JSON.parse(d);
		if (data != undefined && data.included != undefined) {

			let map = {};
			map.author = "Unknown";

			const mapData = data.data[0];
			const includes = data.included;

			for (let i = 0; i < includes.length; i++) {
				let thisData = includes[i];
				switch (thisData.type) {
					default:
						continue;
						break;

					case "mapVersion":
						map.imgUrl = thisData.attributes.thumbnailUrlLarge.replace(/( )/g, "%20");
						map.version = thisData.attributes.version;
						map.size = ((thisData.attributes.width / 512) * 10) + "x" + ((thisData.attributes.height / 512) * 10) + " km";
						map.description = thisData.attributes.description.replace(/<\/?[^>]+(>|$)/g, "");;
						map.downloadUrl = thisData.attributes.downloadUrl;
						map.maxPlayers = thisData.attributes.maxPlayers;
						map.ranked = thisData.attributes.ranked;
						break;

					case "player":
						map.author = thisData.attributes.login;
						break;
				}
			}

			map.id = mapData.id;
			map.displayName = mapData.attributes.displayName;
			map.createTime = mapData.attributes.createTime;

			let embedMes = {
				title: "" + map.displayName + " (id #" + map.id + ")",
				description: map.description,
				color: 0x0099FF,
				image: {
					url: map.imgUrl
				},
				fields: [
					{
						name: "Size",
						value: map.size,
						inline: true
					},
					{
						name: "Max players",
						value: map.maxPlayers,
						inline: true
					},
					{
						name: "Ranked",
						value: map.ranked,
						inline: true
					},
					{
						name: "Author",
						value: map.author,
						inline: true
					}
				]
			}

			if (map.downloadUrl != undefined) {
				embedMes.url = map.downloadUrl.replace(/ /g, "%20");
			}

			callback(embedMes);
			return;

		}
		else {
			let embedMes = {
				title: "Error",
				description: "Uknown map",
				color: 0xFF0000,
			}
			callback(embedMes);
			return;
		}

	});

}
}