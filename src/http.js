const SERVER_URL = 'https://dynamic-products.kingofdog.de';

let _modName;
let agreedToOnline = false;
let loggedIn = false;
let currentUser;

function sendRequest(method, route, data) {
    return new Promise((resolve, reject) => {
        $.ajax({
            method: method,
            data: JSON.stringify(data),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            url: SERVER_URL + '/' + route,
            success: (result) => resolve(result),
            error: (error) => reject(error),
        });
    });
}

module.exports.initOnline = function (modName) {
    _modName = modName;
    console.log(GetRootScope().settings);

    agreedToOnline = GetRootScope().settings[modName].agreedToOnline || false;
    loggedIn = GetRootScope().settings[modName].loggedIn || false;
    if (loggedIn) {
        currentUser = {
            steamID: Game.debug.steamId,
            username: GetRootScope().settings[modName].username,
        };

        Helpers.DynamicProductsLogout = () => {
            agreedToOnline = false;
            loggedIn = false;
            currentUser = null;
            GetRootScope().settings[modName].agreeToOnline = false;
            GetRootScope().settings[modName].loggedIn = false;
            GetRootScope().settings[modName].username = null;
        };
    }
}

module.exports.hasAgreedToOnline = function () {
    return agreedToOnline;
}

module.exports.agreeToOnline = function () {
    agreedToOnline = true;
    GetRootScope().settings[_modName].agreedToOnline = true;
}

module.exports.isLoggedIn = function () {
    return loggedIn;
}

module.exports.login = async function (steamID, username) {
    return new Promise((resolve, reject) => {
        if (!agreedToOnline) {
            reject();
            return;
        }
        sendRequest('POST', 'login', {
                steamID,
                username
            })
            .then(result => {
                console.log(result);

                if (result.Success) {
                    loggedIn = true;
                    currentUser = {
                        steamID,
                        username,
                    };
                    GetRootScope().settings[_modName].loggedIn = true;
                    GetRootScope().settings[_modName].username = username;
                    resolve(loggedIn);
                    return;
                }
                reject();
            })
            .catch(error => console.log(error));
    });
}

module.exports.getPresets = async function () {
    if (!agreedToOnline || !loggedIn) {
        return;
    }
    const results = await sendRequest('GET', 'presets', null);
    return results;
}

module.exports.downloadPreset = async function (presetID) {
    if (!agreedToOnline || !loggedIn) {
        return;
    }
    const result = await sendRequest('GET', 'preset/' + presetID, null);
    return result;
}

module.exports.uploadPreset = async function(preset) {
    if(!agreedToOnline || !loggedIn) {
return;
    }
    preset.author = currentUser.steamID;
    const result = await sendRequest('POST', 'preset', preset);
    return result;
}