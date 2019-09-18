const winston = require("winston");
//require("winston-mongodb");

// handles errors in async functions w/o crashing program,
// and passes unhandled errors to ../middleware/error
require("express-async-errors");

module.exports = function () {
    // winston can log errors to multiple transports (transport = where log is stored)
    // including: Console, File, Http, MongoDB, and more
    winston.handleExceptions(
        new winston.transports.Console({ colorize: true, prettyPrint: true }),
        new winston.transports.File({ filename: "uncaughtExceptions.log" })
    );

    // Catches unhandled rejected promises (winston currently does not support)
    process.on("unhandledRejection", (e) => { throw e; });

    winston.add(winston.transports.File, { filename: "logfile.log" });
    // winston.add(winston.transports.MongoDB, {
    //     db: "mongodb://localhost/vidly",
    //     level: "info"
    // });
}