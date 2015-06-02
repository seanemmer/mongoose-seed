# mongoose-seed

mongoose-seed lets you seed your MongoDB with all the benefits of mongoose validation.  

## Basic example

```javascript

var db = 'mongodb://localhost/clickstarter-dev'
var modelFiles = [
	'app/model1File.js',
	'app/model2File.js'
]

seeder.connect(db, function() {
	
	seeder.loadModels(modelFiles);

	seeder.clearModels(['Model1', 'Model2'], function() {
		// Callback to populate DB once collections have been cleared
		seeder.populateModels(data);
	});
});


// Data array containing seed documents organized by model
var data = [
	{ 
		'model': 'Model1',
		'documents': [
			{
				'name': 'Doc1'
				'value': 200
			},
			{
				'name': 'Doc2'
				'value': 400
			}
		]
	}
];	


```

## Methods

### seeder.loadModels

### seeder.clearModels

### seeder.populateModels

