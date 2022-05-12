//dependencies

const fs = require("fs");
const path = require("path");

const lib = {};

// base directory of the data folder
lib.basedir = path.join(__dirname, "/../.data/");

// write data to file
lib.create = (dir, file, data, callback) => {
  // open file for writing
  // fileDescriptor is just a references for the file if the file is readable
  fs.open(`${lib.basedir + dir}/${file}.json`, "wx", (err1, fileDescriptor) => {
    if (!err1 && fileDescriptor) {
      // convert data to string
      const stringData = JSON.stringify(data);
      // write data to file then close it
      fs.writeFile(fileDescriptor, stringData, (err2) => {
        if (!err2) {
          fs.close(fileDescriptor, (err3) => {
            if (!err3) {
              callback(false);
            } else {
              callback("Error closing the file");
            }
          });
        } else {
          callback("Error writing to new file");
        }
      });
    } else {
      callback("could not create new file, it may already exists!");
    }
  });
};

// read data from file
lib.read = (dir, file, callback) => {
  fs.readFile(`${lib.basedir + dir}/${file}.json`, "utf8", (err, data) => {
    callback(err, data);
  });
};

// update existing file
lib.update = (dir, file, data, callback) => {
  //file open for writing
  fs.open(`${lib.basedir + dir}/${file}.json`, "r+", (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // convert the data to string
      const stringData = JSON.stringify(data);
      //truncate the file
      fs.ftruncate(fileDescriptor, (err) => {
        if (!err) {
          // write to the file and close it
          fs.writeFile(fileDescriptor, stringData, (err2) => {
            if (!err2) {
              // close the file
              fs.close(fileDescriptor, (err3) => {
                if (!err3) {
                  callback(false);
                } else {
                  callback("Error closing the file");
                }
              });
            } else {
              callback("Error writing to new file");
            }
          });
        } else {
          console.log("Error truncating the file");
        }
      });
    } else {
      console.log("Error updating file. File may not exist! ");
    }
  });
};

// delete data from file
lib.delete = (dir, file, callback) => {
  // unlink
  fs.unlink(`${lib.basedir + dir}/${file}.json`, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback(`Error deleting the file`);
    }
  });
};

// list all the items in the directory
lib.list = (dir, callback) => {
  fs.readdir(`${lib.basedir + dir}/`, (err, fileNames) => {
    if (!err && fileNames && fileNames.length > 0) {
      fileNames.forEach((fileNames) => {
        let trimmedFileNames = [];
        fileNames.forEach((fileNames) => {
          trimmedFileNames.push(fileNames.replace(".json", ""));
        });
        callback(false, trimmedFileNames);
      });
    } else {
      callback("Error loading file directory");
    }
  });
};

module.exports = lib;
