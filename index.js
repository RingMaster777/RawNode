//dependencies
const http = require('http');
const { handleReqRes } = require('./helpers/handleReqRes');
const environment = require('./helpers/environments');
const data = require('./lib/data');
//module scuff holding
const app = {}

// testing file system 

//to create
// data.create('test', 'newFile', { name: 'Bangladesh', language: 'Bengali' }, (err) => {
//     console.log('error was', err);
// })


// //to read
// data.read('test', 'newFile', (err, result) => {
//     console.log(err, result);
// });

// //to update
// data.update('test', 'newFile', {
//     name: 'England', language: 'English'
// }, (err) => {
//     console.log(err);
// });

// //to delete
// data.delete('test', 'newFile', (err) => {
//     console.log(err);
// });


// create server 
app.createServer = () => {
    const server = http.createServer(app.handleReqRes);
    server.listen(environment.port, () => {
        console.log(`environment variable is ${environment.port}`);

        //console.log('listening to 3000');


    })
}

// handle request response  
app.handleReqRes = handleReqRes


app.createServer() 