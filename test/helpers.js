var chai = require('chai'),
    app = require('../index'),
    mongoose = require('mongoose');

global.app = app;
global.expect = chai.expect;
global.should = chai.should();
global.assert = chai.assert;
global.mongoose = mongoose;
