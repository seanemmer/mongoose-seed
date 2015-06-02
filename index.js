'use strict';

/**
 * Module dependencies.
 **/
var _ = require('lodash'),
	async = require('async'),
	mongoose = require('mongoose'),
	chalk = require('chalk'),
	path = require('path');

function Seeder() {
	this.connected = false;
}

Seeder.prototype.connect = function(db, cb) {
	var _this = this;
	mongoose.connect(db, function(err) {
		// Log Error
		if (err) {
			console.error(chalk.red('Could not connect to MongoDB!'));
			console.log(err);
		} else {
			_this.connected = true;
			console.log('Successfully initialized mongoose-seed');
			cb();
		}
	});	
};

Seeder.prototype.loadModels = function(modelPaths) {
	console.log(modelPaths);
	modelPaths.forEach(function(modelPath) {
		require(path.resolve(modelPath));
	});
};

Seeder.prototype.invalidModelCheck = function(models, cb) {
	var invalidModels = [];
	
	models.forEach(function(model) {
		if(_.indexOf(mongoose.modelNames(), model) === -1) {
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
	if(!this.connected) {
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
	var invalidModels = this.invalidModelCheck(modelNames, function(err) {
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
				console.log(modelName + 's collection cleared');
				done();
			});
		}, function(err) {
		// Final async callback
			if(err) { return; }
			cb();
		});
	});
};

Seeder.prototype.populateModels = function(seedData) {
	if(!this.connected) {
		return new Error('Not connected to db, exiting function');
	}

	var modelNames = _.unique(_.pluck(seedData,'model'));

	// Confirm that all Models have been registered in Mongoose
	var invalidModels = this.invalidModelCheck(modelNames, function(err) {
		if (err) {
			console.error(chalk.red('Error: ' + err.message));
			return;
		}

		// Populate each model
		seedData.forEach(function(entry) {
			var Model = mongoose.model(entry.model);
			entry.documents.forEach(function(document, j) {
				Model.create(document, function(err) {
					if (err) {
						console.error(chalk.red('Error creating document [' + j + '] of ' + entry.model + ' model'));
						console.error(chalk.red('Error: ' + err.message));
						return;
					}
					console.log('Successfully created document [' + j + '] of ' + entry.model + ' model');
				});
			});
		});

	});
};

module.exports = new Seeder();