//module scuff holding
const handler = {}

handler.notFoundHandler = (requestProperties, callback) => {
    callback(404, {
        message: 'This is not found'
    })


}

module.exports = handler