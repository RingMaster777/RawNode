const data = require("../../lib/data");
const { hash, createRandomString } = require("../../helpers/utilities");
const { user, token } = require("../../routes");
const { parseJSON } = require("../../helpers/utilities");

//module scuff holding
const handler = {};

handler.tokenHandler = (requestProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handler._token[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }
};

handler._token = {};

// create token
handler._token.post = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.body.phone === "string" &&
    requestProperties.body.phone.trim().length == 11
      ? requestProperties.body.phone
      : false;
  const password =
    typeof requestProperties.body.password === "string" &&
    requestProperties.body.password.trim().length > 0
      ? requestProperties.body.password
      : false;
  if (phone && password) {
    data.read("users", phone, (err, userData) => {
      let hashedPassword = hash(password);
      if (hashedPassword === parseJSON(userData).password) {
        let tokenId = createRandomString(20);
        let expired = Date.now() + 60 * 60 * 100;
        let tokenObject = {
          phone,
          id: tokenId,
          expired,
        };

        // store token

        data.create("tokens", tokenId, tokenObject, (err2) => {
          if (!err2) {
            callback(200, tokenObject);
          } else {
            callback(500, {
              error: "server site problem",
            });
          }
        });
      } else {
        callback(400, {
          error: "password not valid",
        });
      }
    });
  } else {
    callback(400, {
      error: "Problem in your request",
    });
  }
};

handler._token.get = (requestProperties, callback) => {
  const id =
    typeof requestProperties.queryStringObject.id === "string" &&
    requestProperties.queryStringObject.id.trim().length == 20
      ? requestProperties.queryStringObject.id
      : false;
  if (id) {
    //lockup the token
    data.read("tokens", id, (err, tokenData) => {
      const token = { ...parseJSON(tokenData) };

      if (!err && token) {
        callback(200, token);
      } else {
        callback(404, {
          error: "Requested token was not found",
        });
      }
    });
  } else {
    callback(404, {
      error: "Requested token was not found",
    });
  }
};

//update
handler._token.put = (requestProperties, callback) => {
  const id =
    typeof requestProperties.body.id === "string" &&
    requestProperties.body.id.trim().length == 20
      ? requestProperties.body.id
      : false;

  const extend =
    typeof requestProperties.body.extend === "boolean" &&
    requestProperties.body.extend == true
      ? true
      : false;

  if (id && extend) {
    data.read("tokens", id, (err, tokenData) => {
      let tokenObject = { ...parseJSON(tokenData) };
      if (tokenObject.expired > Date.now()) {
        tokenObject.expired = Date.now() + 60 * 60 * 1000;

        data.update("tokens", id, tokenObject, (err2) => {
          if (!err2) {
            callback(200);
          } else {
            callback(500, {
              error: "server site error",
            });
          }
        });
      } else {
        callback(400, {
          error: "token already expired",
        });
      }
    });
  } else {
    callback(400, {
      error: "Problem in your request",
    });
  }
};

handler._token.delete = (requestProperties, callback) => {
  const id =
    typeof requestProperties.queryStringObject.id === "string" &&
    requestProperties.body.id.trim().length == 20
      ? requestProperties.body.id
      : false;

  if (id) {
    //lockup the user
    data.read("tokens", id, (err1, tokenData) => {
      if (!err1 && tokenData) {
        //password must be deleted so that the person doesn't get exposed
        data.delete("tokens", id, (err2) => {
          if (!err2) {
            callback(200, {
              message: "token was deleted successfully",
            });
          } else {
            callback(500, {
              error: "There was a problem in you server",
            });
          }
        });
      } else {
        callback(500, {
          error: "There was a problem in you server",
        });
      }
    });
  } else {
    callback(400, {
      error: "There was a problem in your request",
    });
  }
};

handler._token.verify = (id, phone, callback) => {
  data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      if (
        parseJSON(tokenData).phone === phone &&
        parseJSON(tokenData).expired > Date.now()
      ) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

module.exports = handler;
