// modules scuff holding
const crypto = require('crypto');
const environments = require('./environments');
const utilities = {};

// parse json string to object
utilities.parseJSON = (jsonString) => {
    let output = {};
    try {
        output = JSON.parse(jsonString);
    } catch {
        output = {};
    }
    return output;
}



utilities.hash = (str) => {
    if (typeof (str) === 'sting' && str.length > 0) {
        let hash = crypto.createHmac('sha256', environments.secretKey)
            .update(str)
            .digest('hex');
        return hash;
    } else {
        return false
    }
}
// export module
module.exports = utilities;
