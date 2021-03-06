const data = require("../../lib/data");
const { user } = require("../../routes");
const { hash } = require("../../helpers/utilities");
const { parseJSON } = require("../../helpers/utilities");
const tokenHandler = require("./tokenHandler");

//module scuff holding
const handler = {};

handler.userHandler = (requestProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handler._users[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }
};

handler._users = {};

handler._users.post = (requestProperties, callback) => {
  const firstName =
    typeof requestProperties.body.firstName === "string" &&
    requestProperties.body.firstName.trim().length > 0
      ? requestProperties.body.firstName
      : false;
  const lastName =
    typeof requestProperties.body.lastName === "string" &&
    requestProperties.body.lastName.trim().length > 0
      ? requestProperties.body.lastName
      : false;
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
  const tosAgreement =
    typeof requestProperties.body.tosAgreement === "boolean"
      ? requestProperties.body.tosAgreement
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // make sure that this user already doesn't exist
    data.read("users", phone, (err) => {
      if (err) {
        const userObject = {
          firstName,
          lastName,
          phone,
          password: hash(password),
          tosAgreement,
        };

        // store in the database

        data.create("users", phone, userObject, (err2) => {
          if (!err2) {
            callback(200, {
              message: "User created !",
            });
          } else {
            callback(500, {
              error: "Could not create a user",
            });
          }
        });
      } else {
        callback(500, {
          error: "There is already an user with this information",
        });
      }
    });
  } else {
    callback(400, {
      error: "You have a problem in your post request",
    });
  }
};

// authentication
handler._users.get = (requestProperties, callback) => {
  // check the phone number if it is valid or not

  const phone =
    typeof requestProperties.queryStringObject.phone === "string" &&
    requestProperties.queryStringObject.phone.trim().length == 11
      ? requestProperties.queryStringObject.phone
      : false;
  if (phone) {
    //verify token

    let token =
      typeof requestProperties.headersObject.token === "string"
        ? requestProperties.headersObject.token
        : false;

    tokenHandler._token.verify(token, phone, (tokenId) => {
      if (tokenId) {
        //lockup the user
        data.read("users", phone, (err, u) => {
          const user = { ...parseJSON(u) };

          if (!err && user) {
            //password must be deleted so that the person doesn't get exposed
            delete user.password;
            callback(200, user);
          } else {
            callback(404, {
              error: "Requested user was not found",
            });
          }
        });
      } else {
        callback(403, {
          error: "authentication failed",
        });
      }
    });
  } else {
    callback(404, {
      error: "Requested user was not found",
    });
  }
};

// authentication
handler._users.put = (requestProperties, callback) => {
  // check if valid or not
  const phone =
    typeof requestProperties.body.phone === "string" &&
    requestProperties.body.phone.trim().length == 11
      ? requestProperties.body.phone
      : false;
  const firstName =
    typeof requestProperties.body.firstName === "string" &&
    requestProperties.body.firstName.trim().length > 0
      ? requestProperties.body.firstName
      : false;
  const lastName =
    typeof requestProperties.body.lastName === "string" &&
    requestProperties.body.lastName.trim().length > 0
      ? requestProperties.body.lastName
      : false;
  const password =
    typeof requestProperties.body.password === "string" &&
    requestProperties.body.password.trim().length > 0
      ? requestProperties.body.password
      : false;
  if (phone) {
    if (firstName || lastName || password) {
      let token =
        typeof requestProperties.headersObject.token === "string"
          ? requestProperties.headersObject.token
          : false;

      tokenHandler._token.verify(token, phone, (tokenId) => {
        if (tokenId) {
          // lookup the user so read operation must be performed
          data.read("users", phone, (err1, uData) => {
            const userData = { ...parseJSON(uData) };
            if (!err1 && userData) {
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.password = hash(password);
              }

              // store in the database
              data.update("users", phone, userData, (err2, userData) => {
                if (!err2) {
                  callback(200, {
                    message: "User is Updated successfully",
                  });
                } else {
                  callback(500, {
                    error: "There is a problem in the server site",
                  });
                }
              });
            } else {
              callback(400, {
                error: "There is a problem in your request",
              });
            }
          });
        } else {
          callback(403, {
            error: "authentication failed",
          });
        }
      });
    } else {
      callback(400, {
        error: "There is a problem in your request",
      });
    }
  } else {
    callback(400, {
      error: "Invalid phone number please try again",
    });
  }
};

// authentication
handler._users.delete = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.queryStringObject.phone === "string" &&
    requestProperties.body.phone.trim().length == 11
      ? requestProperties.body.phone
      : false;

  if (phone) {
    //verify token

    let token =
      typeof requestProperties.headersObject.token === "string"
        ? requestProperties.headersObject.token
        : false;

    tokenHandler._token.verify(token, phone, (tokenId) => {
      if (tokenId) {
        //lockup the user
        //lockup the user
        data.read("users", phone, (err1, userData) => {
          if (!err1 && userData) {
            //password must be deleted so that the person doesn't get exposed
            data.delete("users", phone, (err2) => {
              if (!err2) {
                callback(200, {
                  message: "User deleted successfully",
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
        callback(403, {
          error: "authentication failed",
        });
      }
    });
  } else {
    callback(400, {
      error: "There was a problem in your request",
    });
  }
};

module.exports = handler;
