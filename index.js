'use strict';

/**
 * Module dependencies.
 **/
var _ = require('lodash'),
    async = require('async'),
    mongoose = require('mongoose'),
    Promise = require('bluebird'),
    chalk = require('chalk'),
    path = require('path');

function Seeder() {
    this.connected = false;
}

Seeder.prototype.connect = function(...params) {
    var _this = this;

    var db, cb = null;
    var opts = [];

    if (params.length == 2) {
        db = params[0];
        cb = params[1];
    } else if (params.length == 3) {
        db = params[0];
        opts = params[1];
        cb = params[2];
    } else {
        console.error('Pass either 2 or 3 arguments to seeder.connect');
        process.exit(1);
    }
    opts.promiseLibrary = Promise;


    if (mongoose.connection.readyState === 1) {
        _this.connected = true;
        console.log('Successfully initialized mongoose-seed');
        cb();
    } else {
        if (opts) {
            mongoose.connect(db, opts, function (err) {
                afterConnect(_this, err, cb);
            });
        } else {
            mongoose.connect(db, function (err) {
                afterConnect(_this, err, cb);
            });
        }
    }
};

function afterConnect(_this, err, cb) {
    // Log Error
    if (err) {
        console.error(chalk.red('Could not connect to MongoDB!'));
        console.log(err);
    } else {
        _this.connected = true;
        console.log('Successfully initialized mongoose-seed');
        cb();
    }
}

Seeder.prototype.loadModels = function(modelPaths) {
    console.log(modelPaths);
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
            Model.remove({})
              .then(function() {
                done();
                console.log(modelName + 's collection cleared');
              })
              .catch(function(err) {
                console.error(chalk.red('Error: ' + err.message));
                return;
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

    var modelNames = _.unique(_.pluck(seedData, 'model'));

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
              Model.create(document)
                .then(function() {
                  console.log('Successfully created document [' + j + '] of ' + entry.model + ' model');
                  innerCallback();
                })
                .catch(function(err) {
                  console.error(chalk.red('Error creating document [' + j + '] of ' + entry.model + ' model'));
                  console.error(chalk.red('Error: ' + err.message));
                  innerCallback();
                })
            }, function(err) {
                outerCallback();
            });
        }, function(err) {
            cb();
        });
    });
};

Seeder.prototype.disconnect = function disconnect() {
  mongoose.disconnect();
};

module.exports = new Seeder();

