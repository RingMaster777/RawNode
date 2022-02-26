const data = require('../../lib/data');
const { user } = require('../../routes');
const { hash } = require('../../helpers/utilities');
const { parseJSON } = require('../../helpers/utilities');


//module scuff holding
const handler = {}

handler.userHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._users[requestProperties.method](requestProperties, callback)
    } else {
        callback(405);
    }
};

handler._users = {}

handler._users.post = (requestProperties, callback) => {
    const firstName = typeof (requestProperties.body.firstName) === 'string' && requestProperties.body.firstName.trim().length > 0 ? requestProperties.body.firstName : false;
    const lastName = typeof (requestProperties.body.lastName) === 'string' && requestProperties.body.lastName.trim().length > 0 ? requestProperties.body.lastName : false;
    const phone = typeof (requestProperties.body.phone) === 'string' && requestProperties.body.phone.trim().length == 11 ? requestProperties.body.phone : false;
    const password = typeof (requestProperties.body.password) === 'string' && requestProperties.body.password.trim().length > 0 ? requestProperties.body.password : false;
    const tosAgreement = typeof (requestProperties.body.tosAgreement) === 'boolean' ? requestProperties.body.tosAgreement : false;


    if (firstName && lastName && phone && password && tosAgreement) {
        // make sure that this user already doesn't exist
        data.read('user', phone, (err) => {
            if (err) {
                const userObject = {
                    firstName,
                    lastName,
                    phone,
                    password: hash(password),
                    tosAgreement
                }

                // store in the database

                data.create('users', phone, userObject, (err2) => {
                    if (!err2) {
                        callback(200, {
                            message: 'User created !'
                        })

                    } else {
                        callback(500, {
                            error: 'Could not create a user'
                        })
                    }
                })

            } else {
                callback(500, {
                    'error': 'There is already an user with this information'
                })
            }
        });


    } else {
        callback(400, {
            error: 'You have a problem in your post request'
        });
    }
}

handler._users.get = (requestProperties, callback) => {
    // check the phone number if it is valid or not

    const phone = typeof (requestProperties.queryStringObject.phone) === 'string' && requestProperties.queryStringObject.phone.trim().length == 11 ? requestProperties.queryStringObject.phone : false;
    if (phone) {
        data.read('users', phone, (err, u) => {
            const user = { ...parseJSON(u) }
            /*
            ...  as single level user
            */
            if (!err && user) {
                delete user.password;
                callback(200, user)

            } else {
                callback(404, {
                    error: 'requested user was not found'
                })
            }
        })

    } else {
        callback(404, {
            error: 'requested user was not found'
        })
    }

}


handler._users.put = (requestProperties, callback) => {
    const phone = typeof (requestProperties.body.phone) === 'string' && requestProperties.body.phone.trim().length == 11 ? requestProperties.body.phone : false;
    if (phone) {
        const firstName = typeof (requestProperties.body.firstName) === 'string' && requestProperties.body.firstName.trim().length > 0 ? requestProperties.body.firstName : false;
        const lastName = typeof (requestProperties.body.lastName) === 'string' && requestProperties.body.lastName.trim().length > 0 ? requestProperties.body.lastName : false;
        const phone = typeof (requestProperties.body.phone) === 'string' && requestProperties.body.phone.trim().length == 11 ? requestProperties.body.phone : false;
        const password = typeof (requestProperties.body.password) === 'string' && requestProperties.body.password.trim().length > 0 ? requestProperties.body.password : false;
        if (firstName || lastName || phone || password) {

        } else {
            callback(400, {
                error: 'There is a problem in your request'
            })

        }

    } else {
        callback(400, {
            error: 'There is a problem in your request'
        })
    }

}
handler._users.delete = (requestProperties, callback) => {
    const phone = typeof (requestProperties.queryStringObject.phone) === 'string' && requestProperties.body.phone.trim().length == 11 ? requestProperties.body.phone : false;


}

module.exports = handler