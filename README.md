# Steam Sharer
Steam Sharer is a node.js script based off the [node-steam-user](https://github.com/DoctorMcKay/node-steam-user) framework. It was created to easily authorize and deauthorize accounts for steam family sharing in a short amount of time, all from the command line.

## Installation
You must have [node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed to install and run the script. 
To check if these programs are installed you can run `node-v` and `npm -v`, if either of these commands cause a error or print a non-valid version number you must install them.
After npm is working properly in order to install all dependencies, run `npm i` in the same directory as `package.json`. Alternatively you could just run `install.bat` to install all required dependencies.
#### Prebuilt release
The relase on the right side of the page was ran on `win10 x64 20H2` so results may vary on running the script. This prebuilt release was built using [pkg](https://www.npmjs.com/package/pkg), it does not require node.js or npm installed to run.
## Usage
To run the script you must run either of the below commands.
```
npm run-script main

node .\SteamSharer.js
```
When prompted you must enter your username and password. Which will save the account details to a local file `.\account.json`. This is saved so that on the following runs you will not have to enter a username or password. Alternatively you can pass the username and password as arguments when running the command `node .\SteamSharer.js <username> <password>`.

Next the program will ask you to enter the SteamID64 of the account you wish to authorize, you can get this either through a profile perma link or through a website like [steamrep](https://steamrep.com/). 

`SteamID for an account to auth: 76561198119580255`

To halt the program you must hit `Ctrl+C`, it may take two attempts.
## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[ISC](https://choosealicense.com/licenses/isc/)
