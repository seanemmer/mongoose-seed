'use strict';

var mongoose = require('mongoose'),
    seeder = require('../index'),
    connection_url = 'mongodb://localhost/seed_test';

describe('Mongoose-Seeder', function() {

    beforeEach(function(done) {
        mongoose.connection.close(function() {
            done();
        });
    });

    it('check mongoose connection', function(done) {
        seeder.connect(connection_url, function() {
            expect(mongoose.connection.readyState).to.equal(1);
            done();
        });

    });

    it('passes connection options', function (done) {
        var connection_options = {
            reconnectTries: 3,
            reconnectInterval: 1000
        };
        seeder.connect(connection_url, connection_options, function () {
            expect(mongoose.connection.readyState).to.equal(1);
            done();
        });
    });
    
    it('Load Models', function(done) {
        seeder.connect(connection_url, function() {
            seeder.loadModels(['test/testModel.js']);
            mongoose.models.should.property('TestModel');
            done();
        });
    });

    it('description', function(done) {
        seeder.connect(connection_url, function() {
            seeder.populateModels([
                {
                    'model': 'TestModel',
                    'documents': [
                        {
                            'name': 'teste'
                        }
                    ]
                }
            ], function() {
                mongoose.models.TestModel.findOne({name: 'teste'}).exec(function(err, test) {
                    expect(err).to.be.null;
                    expect(test.name).to.equal('teste');
                    done();
                });

            });

        });
    });

    it('Clear the model', function(done) {

        seeder.connect(connection_url, function() {

            seeder.clearModels(['TestModel'], function() {
                mongoose.models.TestModel.find().exec(function(err, test) {
                    expect(err).to.be.null;
                    test.should.have.length(0);
                    done();
                });
            });

        });

    });

    it('check no debug output', function(done) {
        var outputDone = false;
        var consoleOutput = '';
        var originalLog = console.log;

        console.log = function (message) {
            outputDone = true;
            consoleOutput += message;
        };

        seeder.setLogOutput(false);
        seeder.connect(connection_url, function () {
            expect(consoleOutput).to.equal('');
            expect(outputDone).to.be.false;

            seeder.setLogOutput(true);
            console.log = originalLog;
            done();
        });

    });

    it('check debug output', function(done) {
        var outputDone = false;
        var consoleOutput = '';
        var originalLog = console.log;

        console.log = function (message) {
            outputDone = true;
            consoleOutput += message;
        };

        seeder.connect(connection_url, function () {
            expect(outputDone).to.be.true;
            expect(consoleOutput).to.equal('Successfully initialized mongoose-seed');

            console.log = originalLog;
            done();
        });

    });

});
