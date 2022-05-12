//handle user defined checks

const data = require("../../lib/data");
const { parseJSON, createRandomString } = require("../../helpers/utilities");
const tokenHandler = require("./tokenHandler");
const { maxChecks } = require("../../helpers/environments");

//module scuff holding
const handler = {};

handler.checkHandler = (requestProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handler._check[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }
};

handler._check = {};

handler._check.post = (requestProperties, callback) => {
  let protocol =
    typeof requestProperties.body.protocol === "string" &&
    ["http", "https"].indexOf(requestProperties.body.protocol) > -1
      ? requestProperties.body.protocol
      : false;

  let url =
    typeof requestProperties.body.url === "string" &&
    requestProperties.body.url.trim().length > 0
      ? requestProperties.body.url
      : false;

  let method =
    typeof requestProperties.body.method === "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(requestProperties.body.method) > -1
      ? requestProperties.body.method
      : false;

  let successCode =
    typeof requestProperties.body.successCode === "object" &&
    requestProperties.body.successCode instanceof Array
      ? requestProperties.body.successCode
      : false;

  let timeoutSeconds =
    typeof requestProperties.body.timeoutSeconds === "number" &&
    requestProperties.body.timeoutSeconds % 1 === 0 &&
    requestProperties.body.timeoutSeconds > 1 &&
    requestProperties.body.timeoutSeconds <= 5
      ? requestProperties.body.timeoutSeconds
      : false;

  if (protocol && url && successCode && timeoutSeconds) {
    const token =
      typeof requestProperties.headersObject.token === "string"
        ? requestProperties.headersObject.token
        : false;

    // look up the user phone
    data.read("tokens", token, (err1, tokenData) => {
      if (!err1 && tokenData) {
        const userPhone = parseJSON(tokenData).phone;
        // look up the user data
        data.read("users", userPhone, (err2, userData) => {
          if (!err2 && userData) {
            tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {
              if (tokenIsValid) {
                let userObject = parseJSON(userData);
                let userChecks =
                  typeof userObject.checks === "object" &&
                  userObject.checks instanceof Array
                    ? userObject.checks
                    : [];

                if (userChecks.length < maxChecks) {
                  let checkId = createRandomString(20);
                  let checkObject = {
                    id: checkId,
                    userPhone,
                    protocol,
                    url,
                    method,
                    successCode,
                    timeoutSeconds,
                  };

                  //save the objects
                  data.create("checks", checkId, checkObject, (err3) => {
                    if (!err3) {
                      //add the checkId in the user Objects
                      userObject.checks = userChecks;
                      userObject.checks.push(checkId);

                      // save the user data
                      data.update("users", userPhone, userObject, (err4) => {
                        if (!err4) {
                          callback(200, checkObject);
                        } else {
                          callback(500, {
                            error: "Server site error",
                          });
                        }
                      });
                    } else {
                      callback(500, {
                        error: "Server site problem",
                      });
                    }
                  });

                  //
                } else {
                  callback(401, {
                    error: "Limit finished",
                  });
                }
              } else {
                callback(403, {
                  error: "Authentication failure",
                });
              }
            });
          } else {
            callback(403, {
              error: "user not found",
            });
          }
        });
      } else {
        callback(403, {
          error: "Authentication error",
        });
      }
    });
  } else {
    callback(400, {
      error: "You have a problem in your request",
    });
  }
};

handler._check.get = (requestProperties, callback) => {
  const id =
    typeof requestProperties.queryStringObject.id === "string" &&
    requestProperties.queryStringObject.id.trim().length == 20
      ? requestProperties.queryStringObject.id
      : false;
  if (id) {
    //lockup the check
    data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        const token =
          typeof requestProperties.headersObject.token === "string"
            ? requestProperties.headersObject.token
            : false;
        tokenHandler._token.verify(
          token,
          parseJSON(checkData).userPhone,
          (tokenIsValid) => {
            if (tokenIsValid) {
              callback(200, parseJSON(checkData));
            } else {
              callback(403, {
                error: "Authentication failure",
              });
            }
          }
        );
      } else {
        callback(500, {
          error: "server site error",
        });
      }
    });
  } else {
    callback(404, {
      error: "Requested token was not found",
    });
  }
};

handler._check.put = (requestProperties, callback) => {
  const id =
    typeof requestProperties.body.id === "string" &&
    requestProperties.body.id.trim().length === 20
      ? requestProperties.body.id
      : false;
  const protocol =
    typeof requestProperties.body.protocol === "string" &&
    ["http", "https"].indexOf(requestProperties.body.protocol) > -1
      ? requestProperties.body.protocol
      : false;

  const url =
    typeof requestProperties.body.url === "string" &&
    requestProperties.body.url.trim().length > 0
      ? requestProperties.body.url
      : false;

  const method =
    typeof requestProperties.body.method === "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(requestProperties.body.method) > -1
      ? requestProperties.body.method
      : false;

  const successCode =
    typeof requestProperties.body.successCode === "object" &&
    requestProperties.body.successCode instanceof Array
      ? requestProperties.body.successCode
      : false;

  const timeoutSeconds =
    typeof requestProperties.body.timeoutSeconds === "number" &&
    requestProperties.body.timeoutSeconds % 1 === 0 &&
    requestProperties.body.timeoutSeconds > 1 &&
    requestProperties.body.timeoutSeconds <= 5
      ? requestProperties.body.timeoutSeconds
      : false;

  if (id) {
    if (protocol || url || method || successCode || timeoutSeconds) {
      data.read("checks", id, (err1, checkData) => {
        if (!err1 && checkData) {
          let checkObject = parseJSON(checkData);
          const token =
            typeof requestProperties.headersObject.token === "string"
              ? requestProperties.headersObject.token
              : false;
          tokenHandler._token.verify(
            token,
            checkObject.userPhone,
            (tokenIsValid) => {
              if (tokenIsValid) {
                if (protocol) {
                  checkObject.protocol = protocol;
                }
                if (url) {
                  checkObject.url = url;
                }
                if (method) {
                  checkObject.method = method;
                }
                if (successCode) {
                  checkObject.successCode = successCode;
                }
                if (timeoutSeconds) {
                  checkObject.timeoutSeconds = timeoutSeconds;
                }

                // update in the database
                data.update("checks", id, checkObject, (err2) => {
                  if (!err2) {
                    callback(200, checkObject);
                  } else {
                    callback(500, {
                      error: "Server site error",
                    });
                  }
                });
              } else {
                callback(403, {
                  error: "Authentication error",
                });
              }
            }
          );
        } else {
          callback(500, {
            error: "server site error",
          });
        }
      });
    } else {
      callback(400, {
        error: "Enter at least one field",
      });
    }
  } else {
    callback(400, {
      error: "You have a problem in your request",
    });
  }
};

handler._check.delete = (requestProperties, callback) => {
  const id =
    typeof requestProperties.queryStringObject.id === "string" &&
    requestProperties.queryStringObject.id.trim().length == 20
      ? requestProperties.queryStringObject.id
      : false;
  if (id) {
    //lockup the check
    data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        const token =
          typeof requestProperties.headersObject.token === "string"
            ? requestProperties.headersObject.token
            : false;
        tokenHandler._token.verify(
          token,
          parseJSON(checkData).userPhone,
          (tokenIsValid) => {
            if (tokenIsValid) {
              // delete the check data
              data.delete("checks", id, (err2) => {
                if (!err2) {
                  data.read(
                    "users",
                    parseJSON(checkData).userPhone,
                    (err3, userData) => {
                      let userObject = parseJSON(userData);
                      if (!err3 && userData) {
                        let userChecks =
                          typeof userObject.checks === "object" &&
                          userObject.checks instanceof Array
                            ? userObject.checks
                            : [];
                        // remove  the deleted in from the checks array
                        let checkPosition = userChecks.indexOf(id);
                        if (checkPosition > -1) {
                          userChecks.splice(checkPosition, 1);

                          // now save the updated shit
                          userObject.checks = userChecks;
                          data.update(
                            "users",
                            userObject.phone,
                            userObject,
                            (err4) => {
                              if (!err4) {
                                callback(200);
                              } else {
                                callback(500, {
                                  error: "server site error",
                                });
                              }
                            }
                          );
                        } else {
                          callback(500, {
                            error: "This id does not exists bro",
                          });
                        }
                      } else {
                        callback(500, {
                          error: "server site error",
                        });
                      }
                    }
                  );
                } else {
                  callback(500, {
                    error: "server site error",
                  });
                }
              });
            } else {
              callback(403, {
                error: "Authentication failure",
              });
            }
          }
        );
      } else {
        callback(500, {
          error: "server site error",
        });
      }
    });
  } else {
    callback(404, {
      error: "Requested token was not found",
    });
  }
};

module.exports = handler;
