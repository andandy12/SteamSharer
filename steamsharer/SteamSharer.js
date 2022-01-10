const args = process.argv.slice(2);

const SteamUser = require('steam-user');
const readline = require('readline');
const SteamID = require('steamid'); // required to get accountID for checking if account is authed
const VDF = require('vdf');
const fs = require('fs');
//const computername = require('os').hostname();  // required to get computername that steam would use as default
//const Uint64LE = require("int64-buffer").Uint64LE;

const client = new SteamUser();

const addField = (fieldsToAdd, field, fieldValue) => {
	if (fieldValue !== undefined && fieldValue !== null)
		fieldsToAdd[field] = fieldValue;
	return fieldsToAdd;
}
const askQuestion = (query) => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return new Promise(resolve => rl.question(query, ans => {
		rl.close();
		resolve(ans);
	}))
}

client.on('steamGuard', async function (domain, callback) {
	console.log(`Steam Guard code needed ${(domain) ? `from email ending in ` + domain : ''}`);
	var code = await askQuestion("Enter code: ");
	callback(code);
});

// https://github.com/DoctorMcKay/node-steam-user/wiki/Family-Sharing Family Sharing Github Page

client.on('loggedOn', async function () {
	console.log("\x1b[32mAccount successfully logged in\x1b[0m");

	const LocSteam64 = client.steamID.getSteamID64();
	console.log("\x1b[36mLocal SteamID64: ", LocSteam64, "\x1b[0m");

	async function addSteamIdAsBorrower(SteamID64) {
		console.log("Adding SteamID64(" + SteamID64 + ") to authorized borrowers")
		client.addAuthorizedBorrowers(SteamID64);
		if (await checkifAuthBorrower(SteamID64)) {
			console.log('\x1b[32m%s\x1b[0m', "Account has been successfully added as borrower");
			return SteamID64;
		} else
			console.log('\x1b[31m%s\x1b[0m', "Account was not added as an borrower");
	}

	async function checkifAuthBorrower(SteamID64) {
		let sid = new SteamID(SteamID64);
		let options = {};
		addField(options, "includePending", true);
		let borrowers = await client.getAuthorizedBorrowers(options);
		if (JSON.stringify(borrowers).includes(sid.accountid))
			return true;
		else
			return false;
	}
	// Attempt to authorize device for shaing

	//client.authorizeRemoteSharingDevice(computername, devTokenitem);

	//client.authorizeLocalSharingDevice(computername);

	/*DeviceAuth.ClientAuthorizeLocalDeviceRequest({
		device_description: computername,
		owner_account_id: sid.accountid,
		local_device_token: devTokenitem})
	DeviceAuth.CMsgClientAuthorizeLocalDevice({
		eresult: 1,
		owner_account_id,	 //- The current account's ID
		authed_device_token})//- The resulting device token
	*/
	// Accept authorization for the account and the token

	//console.log(await client.activateSharingAuthorization(borrowersSteam64, devTokenitem));
	//console.log(await client.getAuthorizedSharingDevices());
	var borrowersSteamID;
	for (; ;) {
		//Attempt to add borrower from steamid
		var question;
		if (borrowersSteamID)
			question = `Press enter to authorize ${borrowersSteamID} or provide a new SteamID: `;
		else
			question = "\tSteamID for an account to auth: ";

		input = await askQuestion(question);
		if (input.length > 0)
			borrowersSteamID = input;
		await addSteamIdAsBorrower(borrowersSteamID);

		//console.log("Attempting to authorize device under token:",devTokenitem);
		//await client.activateSharingAuthorization(LocSteam64, devTokenitem);

		await askQuestion("\nPress enter to remove authorization");
		//console.log("Removing device auth from: ", devTokenitem); // I believe device auth is pointless to remove... the client will then not have to reattempt to authorize.
		//await client.deauthorizeSharingDevice(devTokenitem);
		console.log("Removing borrower auth from: ", borrowersSteamID);
		await client.removeAuthorizedBorrowers([borrowersSteamID]);
		if (await checkifAuthBorrower(borrowersSteamID))
			console.log('\x1b[31m%s\x1b[0m', "Account was not removed as an borrower\n");
		else
			console.log('\x1b[32m%s\x1b[0m', "Account was successfully removed as an borrower\n");
	}
});

client.on('debug', async function (str) { // used for steam debug
	//console.log(str);
});

/*
var deviceToken = [];
var filecontents = fs.readFileSync("C:\\Program Files (x86)\\Steam\\config\\config.vdf").toString();
const AuthorizedDevices = VDF.parse(filecontents).InstallConfigStore.AuthorizedDevice;
AuthorizedDevices.forEach((authDevice) => {
	var token = AuthorizedDevices[authDevice]["tokenid"];
	var token2 = new Uint64LE(token);
	//console.log("\x1b[35m\nToken on disk: ",token,"       Converted token: ",token2.toString(10));
	deviceToken.push(token2.toString(10));
});
var devTokenmf = 1, devTokenm = 0, devTokenitem;
for (var i = 0; i < deviceToken.length; i++) {
	for (var j = i; j < deviceToken.length; j++) {
		if (deviceToken[i] == deviceToken[j])
			devTokenm++;
		if (devTokenmf <= devTokenm) {
			devTokenmf = devTokenm;
			devTokenitem = deviceToken[i];
		}
	}
	devTokenm = 0;
}*/
//console.log(devTokenitem+" ( " +devTokenmf +" times ) ") ;
//console.log("\x1b[36m","Using local devicetoken: ", devTokenitem,"\x1b[0m");
//Local Device has been found

var sentryfile = fs.readFileSync("C:\\Program Files (x86)\\Steam\\config\\config.vdf").toString();
sentryfile = VDF.parse(sentryfile).InstallConfigStore.Software.Valve.Steam.SentryFile;

const sentrybuffer = fs.readFileSync(sentryfile);
client.setSentry(sentrybuffer);

var user_config;
if (fs.existsSync('./account.json'))
	user_config = JSON.parse(fs.readFileSync('./account.json').toString());
else
	user_config = { username: "", password: "" };

(async () => {
	console.log("Press Ctrl+C to hault the program at any point!");
	if (args.length === 2) {
		user_config.username = args[0];
		user_config.password = args[1];
	}
	if ((user_config.username == "") || (user_config.password === "")) {
		user_config.username = await askQuestion("Username: ");
		user_config.password = await askQuestion("Password: ");
		fs.writeFileSync('./account.json', JSON.stringify(user_config));
	}
	console.log(`Logging into account with username ${user_config.username}`);
	client.logOn({
		"accountName": user_config.username,
		"password": user_config.password,
		"rememberPassword": true
	})
})();
