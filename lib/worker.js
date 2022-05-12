//dependencies
const data = require("./data");
const url = require("url");
const { parseJSON } = require("../helpers/utilities");
const http = require("http");
const https = require("https");
//module scuff holding
const worker = {};

// lookup all the checks
worker.gatherAllChecks = () => {
  // /get all the checks
  data.list("checks", (err1, checks) => {
    if (!err1 && checks && checks.length > 0) {
      checks.forEach((checks) => {
        // read the checks data
        data.read("checks", check, (err2, originalCheckData) => {
          if (!err2 && originalCheckData) {
            worker.validateCheckData(parseJSON(originalCheckData));
          } else {
            console.log("error could not find any checks");
          }
        });
      });
    } else {
      console.log("error could not find any checks");
    }
  });
};

// validate individual check data
worker.validateCheckData = (originalCheckData) => {
  if (originalCheckData && originalCheckData.id) {
    originalCheckData.state =
      typeof originalCheckData.state === "string" &&
      ["up", "down"].indexOf(originalCheckData.state) > -1
        ? originalCheckData.state
        : "down";

    originalCheckData.lastChecked =
      typeof originalCheckData.lastChecked === "number" &&
      originalCheckData.lastChecked > 0
        ? originalCheckData.lastChecked
        : false;

    // pass to the next process
    worker.performCheck(originalCheckData);
  } else {
    console.log("Checks was invalid");
  }
};

// perform checks
worker.performCheck = (originalCheckData) => {
  // prepare the initial check outcome
  let checkOutcome = {
    error: false,
    responseCode: false,
  };

  // mark the outcome sent
  let outcomeSent = false;

  // parse the host name and full url from the original file
  const parsedUrl = url.parse(
    originalCheckData.protocol + "://" + originalCheckData.url,
    true
  );
  const hostName = parsedUrl.hostname;
  const path = parsedUrl.path;

  const requestDetails = {
    protocol: `${originalCheckData.protocol}:`,
    hostName: hostName,
    method: originalCheckData.method.toUpperCase(),
    path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };

  const protocolToUse =
    originalCheckData.protocol === "http" ? "http" : "https";

  let req = protocolToUse.request(requestDetails, (res) => {
    // grab the status of the response
    const status = res.statusCode;
    // update the check out come and pass to the next process
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on("error", (e) => {
    // update the check out come and pass to the next process
    checkOutcome = {
      error: true,
      value: e,
    };
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });
  req.timeout("error", (e) => {
    // update the check out come and pass to the next process
    checkOutcome = {
      error: true,
      value: "timeout",
    };
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });
  req.end();
};

worker.processCheckOutcome = (originalCheckData, checkOutcome) => {
  let state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.successCode.indexOf(checkOutcome.responseCode);

  let alertWanted =
    originalCheckData.lastChecked && originalCheckData.state !== state
      ? true
      : false;

  let newCheckData = originalCheckData;

  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  data.update("checks", newCheckData.id, newCheckData, (err) => {
    if (!err) {
      if (alertWanted) {
        worker.alertUserToStatusChange(newCheckData);
      } else {
        console.log("alert is not needed");
      }
    } else {
      console.log("Error trying to save check data of one of the checks!");
    }
  });
};

worker.alertUserToStatusChange = (newCheckData) => {
  let msg = `Alert : your check for ${newCheckData.method.toUpperCase()} ${
    newCheckData.protocol
  }://${newCheckData.url} is currently ${newCheckData.state}
  `;
};

// timer to execute the worker process once per minute
worker.loop = () => {
  setInterval(() => {
    worker.gatherAllChecks();
  }, 1000 * 60);
};

worker.init = () => {
  // execute all the checks
  worker.gatherAllChecks();
  // call the loop so that checks continue
  worker.loop();
};

module.exports = worker;
