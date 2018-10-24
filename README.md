# mongoose-seed

mongoose-seed lets you populate and clear MongoDB documents with all the benefits of Mongoose validation

## Basic example

```javascript

var seeder = require('mongoose-seed');

// Connect to MongoDB via Mongoose
seeder.connect('mongodb://localhost/sample-dev', function() {

  // Load Mongoose models
  seeder.loadModels([
    'app/model1File.js',
    'app/model2File.js'
  ]);

  // Clear specified collections
  seeder.clearModels(['Model1', 'Model2'], function() {

    // Callback to populate DB once collections have been cleared
    seeder.populateModels(data, function() {
      seeder.disconnect();
    });

  });
});

// Data array containing seed data - documents organized by Model
var data = [
	{
		'model': 'Model1',
		'documents': [
			{
				'name': 'Doc1',
				'value': 200
			},
			{
				'name': 'Doc2',
				'value': 400
			}
		]
	}
];
```

## Methods

### seeder.connect(db, [options], [callback])

Initializes connection to MongoDB via Mongoose singleton.  
If callback is not supplied, a promise will be returned.

---------------------------------------

### seeder.loadModels(filePaths)

Loads mongoose models into Mongoose singleton.  *Only Models that have been loaded can be cleared or populated.*

---------------------------------------

### seeder.clearModels(modelArray, [callback])

Clears DB collection specified by each model in modelArray.  Callback is executed after DB is cleared (useful for populateModels method)

---------------------------------------

### seeder.populateModels(dataArray, [callback])

Populates MongoDB with documents in dataArray.  dataArray consists of objects with 'model' and 'documents' keys, where 'documents' is an array of valid collection documents.  Note that Mongoose Schema validation *is* enforced.

---

### seeder.disconnect()

Disconnects mongoose db-handle. Use it inside `populateModels` callback to cleanly exit the program
(see example above).

---

### seeder.setLogOutput(logOutput)

Disables or enables calls to `console.log`. If `false` is passed, only errors will be print to console.

---

### seeder.setPromise(PromiseConstructor)

Changes promise library used by the seeder (and in turn the underlying mongoose library).
