var args = process.argv.slice(2);
var hasLoggedIn = false;

//used in askQuestion
const readline = require('readline'); 
//used when logon event happens
var SteamID = require('steamid'); // required to get accountID for checking if account is authed
const os = require('os');  // required to get computername that steam would use as default
const VDF = require('vdf');
var Uint64LE = require("int64-buffer").Uint64LE;
//needed to communicate with steam
const SteamUser = require('steam-user');
const client = new SteamUser();
//filesteam needed to get local files
const fs = require('fs');

const addField = (fieldsToAdd, field, fieldValue) => {
	if(fieldValue !== undefined && fieldValue !== null)
		fieldsToAdd[field] = fieldValue;
	return fieldsToAdd;
};
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}
function sleep(ms) {
	return new Promise((resolve) => {
	  setTimeout(resolve, ms);
	});
} 


client.on('steamGuard', async function(domain, callback) {
	console.log("Steam Guard code needed from email ending in " + domain);
	var code = await askQuestion("Enter steamGuard from email: ");
	callback(code);
});
// https://github.com/DoctorMcKay/node-steam-user/wiki/Family-Sharing Family Sharing Github Page

client.on('loggedOn', async function(details, parental) {
	hasLoggedIn = true;
	console.log("\x1b[32mAccount successfully logged in\x1b[0m");

	const LocSteam64 = client.steamID.getSteamID64();
	console.log("\x1b[36mLocal SteamID64: ",LocSteam64,"\x1b[0m");
	
	//console.log(details);
	//console.log(parental);
	
	const computername = os.hostname();

	async function addSteamIdAsBorrower(SteamID64){
		console.log("Adding SteamID64("+SteamID64+") to authorized borrowers");
		client.addAuthorizedBorrowers(SteamID64);
		if(await checkifAuthBorrower(SteamID64)){
			console.log('\x1b[32m%s\x1b[0m',"Account has been successfully added as borrower");
			return SteamID64;
		}else
			console.log('\x1b[31m%s\x1b[0m',"Account was not added as an borrower");
	}
	
	async function checkifAuthBorrower(SteamID64){
		let sid = new SteamID(SteamID64);
		let options = {};
		addField(options,"includePending",true);
		let borrowers = await client.getAuthorizedBorrowers(options);
		if(JSON.stringify(borrowers).includes(sid.accountid))
			return true;
		else
			return false;
	}
	
	// Attempt to authorize device for sharing -- we currently dont get local device token as these functions are broken
	
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
	for(;;){
		//Attempt to add borrower from steamid
		var question = "";
		if(borrowersSteamID)
			question += `Press enter to authorize ${borrowersSteamID} or provide a new SteamID: `;
		else
			question += "\tSteamID for an account to auth: ";

		input = await askQuestion(question);
		if(input.length > 0)
			borrowersSteamID = input;
		await addSteamIdAsBorrower(borrowersSteamID);
		console.log();
		/*//authorize local device token currently broken
		console.log(await client.getAuthorizedSharingDevices()); // debug
		console.log("Attempting to authorize device under token:",devTokenitem);
		await client.activateSharingAuthorization(LocSteam64, devTokenitem);
		console.log(await client.getAuthorizedSharingDevices()); // debug
		*/

		await askQuestion("Press enter to remove authorization");
		
		//console.log("Removing device auth from: ", devTokenitem); // I believe device auth is pointless to remove... the client will then not have to reattempt to authorize.
		//await client.deauthorizeSharingDevice(devTokenitem);
		console.log("Removing borrower auth from: ", borrowersSteamID);
		await client.removeAuthorizedBorrowers([borrowersSteamID]);
		if(await checkifAuthBorrower(borrowersSteamID))
			console.log('\x1b[31m%s\x1b[0m',"Account was not removed as an borrower");
		else
			console.log('\x1b[32m%s\x1b[0m',"Account was successfully removed as an borrower");
		
		console.log();
	}
});
  
client.on('debug', async function(string) {
	//console.log(string);
});


/* // used to authorize local device currently not working at all times... so removed until library supports authorizing remote devices
var deviceToken = []; 
var filecontents = fs.readFileSync("C:\\Program Files (x86)\\Steam\\config\\config.vdf").toString();
const AuthorizedDevices = VDF.parse(filecontents).InstallConfigStore.AuthorizedDevice;
Object.keys(AuthorizedDevices).forEach((authDevice)=>{
	var token = AuthorizedDevices[authDevice]["tokenid"];
	var token2 = new Uint64LE(token);
	//console.log("\x1b[35m\nToken on disk: ",token,"       Converted token: ",token2.toString(10));
	deviceToken.push(token2.toString(10));
});
var devTokenmf = 1,devTokenm = 0,devTokenitem;
for (var i=0; i<deviceToken.length; i++)
{
	for (var j=i; j<deviceToken.length; j++)
	{
		if (deviceToken[i] == deviceToken[j])
		devTokenm++;
		if (devTokenmf<=devTokenm)
		{
			devTokenmf=devTokenm; 
			devTokenitem = deviceToken[i];
		}
	}
	devTokenm=0;
}
//console.log(devTokenitem+" ( " +devTokenmf +" times ) ") ;
//console.log("\x1b[36m","Using local devicetoken: ", devTokenitem,"\x1b[0m");
//Local Device has been found
*/
var sentryfile = fs.readFileSync("C:\\Program Files (x86)\\Steam\\config\\config.vdf").toString();
try{
	sentryfile = VDF.parse(sentryfile).InstallConfigStore.Software.Valve.Steam.SentryFile;
}catch(e){
	throw 'SentryFile not found in local config.vdf';
}
const sentrybuffer = fs.readFileSync(sentryfile);
client.setSentry(sentrybuffer);
//console.log("\x1b[36m","Using Sentry: ", sentrybuffer,"\x1b[0m");
var user_config;
if(fs.existsSync('./account.json'))
	user_config = JSON.parse(fs.readFileSync('./account.json').toString());
else
	user_config = {username: "",password: ""};

(async () => {
	console.log("Press Ctrl+C to hault the program at any point!");
	if(!hasLoggedIn){
		if(args.length == 2){
			user_config.username = args[0];
			user_config.password = args[1];
		}
		if((user_config.username == "") || (user_config.password === "")){
			user_config.username = await askQuestion("Username: ");
			user_config.password = await askQuestion("Password: ");
			fs.writeFileSync('./account.json',JSON.stringify(user_config));
		}
		let details = {};
		addField(details, "accountName", user_config.username);
		addField(details, "password", user_config.password);
		addField(details, "rememberPassword", true);
		client.logOn(details);
	}
})();