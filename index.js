'use strict';

/**
 * Module dependencies.
 **/
var _ = require('lodash'),
    async = require('async'),
    mongoose = require('mongoose'),
    chalk = require('chalk'),
    path = require('path');

/*
switch (mongoose.connection.readyState) {
  case 0 : Disconnected;
  case 1 : Connected;
  case 2 : Connecting;
  case 3 : Disconnecting;
}
source http://mongoosejs.com/docs/api.html#connection_Connection-readyState
*/

var STATES = {
  Disconnected: 0,
  Connected: 1,
  Connecting: 2,
  Disconnecting: 3
};

function Seeder() {
    this.connected = false;
    this.consoleLogEnabled = true;
    this.promise = Promise;
}

function consoleLog(_this, message) {
    if (_this.consoleLogEnabled !== undefined && _this.consoleLogEnabled === true) {
        console.log(message);
    }
}

/**
 * Set promise type to use, defaults to normal ES6 Promise.
 * @param {Object} promise Promise constructor.
 */
Seeder.prototype.setPromise = function (promise) {
   this.promise = promise;
   mongoose.Promise = this.promise;
};

Seeder.prototype.setLogOutput = function (logOutput) {
    this.consoleLogEnabled = logOutput;
};

/**
 *
 * @param {string} database Connection string.
 * @param {function} [callback} Optional callback to fire, if unset, a promise is returned.
 * @param {Object} [options] Optional MongoDb options.
 * @return {Promise|null}
 */
Seeder.prototype.connect = function(database, options = {}, callback = null) {
    var _this = this;

    if (typeof options === 'function') {
        var oldOptions = options;
        options = (callback ? callback : {});
        callback = oldOptions;
    }

    options.useMongoClient = true;

    if (callback !== null) {
      if (mongoose.connection.readyState === STATES.Connecting) {
        consoleLog(_this, 'Successfully initialized mongoose-seed');
        callback();
        return;
      }

      mongoose.connect(database, options, function (error) {
        afterConnect(_this, error, callback);
      });
    } else {
      return new this.promise(function(resolve, reject) {
        if (mongoose.connection.readyState === STATES.Connecting) {
          consoleLog(_this, 'Successfully initialized mongoose-seed');
          return resolve();
        }
        return mongoose.connect(database, options).then(function() {
          _this.connected = true;
          resolve();
        });
      });
    }
};

function afterConnect(_this, err, cb) {
    // Log Error
    if (err) {
        console.error(chalk.red('Could not connect to MongoDB!'));
        consoleLog(_this, err);
    } else {
        _this.connected = true;
        consoleLog(_this, 'Successfully initialized mongoose-seed');
        cb();
    }
}

Seeder.prototype.loadModels = function(modelPaths) {
    consoleLog(this, modelPaths);
    modelPaths.forEach(function(modelPath) {
        var model = require(path.resolve(modelPath));
        if (model instanceof Function) {
            model();
        }
    });
};

Seeder.prototype.invalidModelCheck = function(models, cb) {
    var invalidModels = [];

    models.forEach(function(model) {
        if (_.indexOf(mongoose.modelNames(), model) === -1) {
            invalidModels.push(model);
        }
    });

    if (invalidModels.length) {
        cb(new Error('Models not registered in Mongoose: ' + invalidModels));
    } else {
        cb();
    }
};

Seeder.prototype.clearModels = function(models, cb) {
    if (!this.connected) {
        return new Error('Not connected to db, exiting function');
    }

    var modelNames = [];
    var _this = this;

    // Convert to array if not already
    if (Array.isArray(models)) {
        modelNames = models;
    } else if (typeof(models) === 'string') {
        modelNames.push(models);
    } else {
        console.error(chalk.red('Error: Invalid model type'));
        return;
    }

    // Confirm that all Models have been registered in Mongoose
    this.invalidModelCheck(modelNames, function(err) {
        if (err) {
            console.error(chalk.red('Error: ' + err.message));
            return;
        }

        // Clear each model
        async.each(modelNames, function(modelName, done) {
            var Model = mongoose.model(modelName);
            Model.remove({}, function(err) {
                if (err) {
                    console.error(chalk.red('Error: ' + err.message));
                    return;
                }
                consoleLog(_this, modelName + 's collection cleared');
                done();
            });
        }, function(err) {
            // Final async callback
            if (err) {
                return;
            }
            cb();
        });
    });
};

Seeder.prototype.populateModels = function(seedData, cb) {
    if (!this.connected) {
        return new Error('Not connected to db, exiting function');
    }

    var modelNames = _.uniq(_.map(seedData, 'model'));
    var _this = this;

    // Confirm that all Models have been registered in Mongoose
    var invalidModels = this.invalidModelCheck(modelNames, function(err) {
        if (err) {
            console.error(chalk.red('Error: ' + err.message));
            return;
        }

        // Populate each model
        async.eachOf(seedData, function(entry, i, outerCallback) {
            var Model = mongoose.model(entry.model);
            async.eachOf(entry.documents, function(document, j, innerCallback) {
                Model.create(document, function(err) {
                    if (err) {
                        console.error(chalk.red('Error creating document [' + j + '] of ' + entry.model + ' model'));
                        console.error(chalk.red('Error: ' + err.message));
                    } else {
                        consoleLog(_this, 'Successfully created document [' + j + '] of ' + entry.model + ' model');
                    }
                    innerCallback();
                });
            }, function(err) {
                outerCallback();
            });
        }, function(err) {
            cb();
        });
    });
};

Seeder.prototype.disconnect = function () {
  mongoose.disconnect();
};

module.exports = new Seeder();
