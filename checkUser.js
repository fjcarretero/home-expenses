var mongoose = require('mongoose'),
models = require('./models');

var usrs = process.argv.slice(2);

var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
mongo = {
    "hostname": process.env[mongoServiceName + '_SERVICE_HOST'],
    "port": parseInt(process.env[mongoServiceName + '_SERVICE_PORT']),
    "username": process.env[mongoServiceName + '_USER'],
    "password": process.env[mongoServiceName + '_PASSWORD'],
    "db": process.env[mongoServiceName + '_DATABASE'],
};

// MongoDB

var generate_mongo_url = function(obj){
	obj.hostname = (obj.hostname || 'localhost');
	obj.port = (obj.port || 27017);
	obj.db = (obj.db || 'test');
	if(obj.username && obj.password){
		return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
	}else{
		return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
	}
};

var mongourl = generate_mongo_url(mongo);
console.log(mongourl);
// Test

models.defineModels(mongoose, function() {
  User = mongoose.model('User');
  db = mongoose.createConnection(mongourl);
  db.on('error', console.error.bind(console, 'connection.error:'));
  db.on('open', function(){
      console.log('open');
  })
});

User.findOne({ email: usrs[0] }, function(err, user) {
    console.log('inside findOne');
    if (err) { 
        console.log('Error '+ err);
        return done(err); 
    }
    if (user) {
        user.name = profile.displayName;
        //user.role = 'admin';
        console.log('User found');
    } else {
        console.log.error('User not found ' + user);
    }
});