
/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  api = require('./routes/api'),
  mongoose = require('mongoose'),
  models = require('./models'),
  passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	morgan  = require('morgan'),
  logger = require('./winston');

var app = module.exports = express();


// Configuration

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.send(500, { error: 'Something blew up!' });
  } else {
    next(err);
  }
}

function errorHandler(err, req, res, next) {
  res.status(500);
  logger.error(err);
  res.render('error', { error: err });
}

app.configure( function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
	app.use(passport.session());
	app.use(morgan('combined', {
			skip: function (req, res) { return req.url === '/probe' }
	}));
  app.use(clientErrorHandler);
  app.use(errorHandler);
  app.use(app.router);
});

var mongo,
	googleConfig;

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  mongo = {
		"hostname":"localhost",
		"port":27017,
		"username":"",
		"password":"",
		"db":"db2"
	};
});

app.configure('production', function(){
	app.use(express.errorHandler());
	//var env = JSON.parse(process.env.VCAP_SERVICES);
	//logger.info(env);
	//mongo = env['mongodb-1.8'][0]['credentials'];
	var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
	mongo = {
		"hostname": process.env[mongoServiceName + '_SERVICE_HOST'],
		"port": parseInt(process.env[mongoServiceName + '_SERVICE_PORT']),
		"username": process.env[mongoServiceName + '_USER'],
		"password": process.env[mongoServiceName + '_PASSWORD'],
		"db": process.env[mongoServiceName + '_DATABASE'],
	};
	//logger.info(mongo1);
	//mongo = env['mongodb-1.8'][0];
});

googleConfig = {
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: process.env.GOOGLE_CALLBACK_URL
};
// Passport

passport.use(new GoogleStrategy( googleConfig,
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      
    logger.info('email=' + profile.emails[0].value);
		User.findOne({ email: profile.emails[0].value }, function(err, user) {
			logger.info('inside findOne');
			if (err) { 
				logger.error('Error '+ err);
				return done(err); 
			}
			if (user) {
				user.name = profile.displayName;
				//user.role = 'admin';
				logger.info('User found');
				return done(null, user);
			} else {
				logger.error('User not found ' + user);
				return done(null, false, { message: 'User not found' });
			}
		});
    });
  }
));

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing. However, since this example does not
// have a database of user records, the complete Google profile is
// serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

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
//var mongourl = mongo['url'];

models.defineModels(mongoose, function() {
  app.User = User = mongoose.model('User');
  app.Item = Item = mongoose.model('Item');
  db = mongoose.connect(mongourl);
});

// Routes
//

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { 
		console.log('login2');
		return next(); 
	}
	console.log('not logged');
	if (req.xhr) {
		res.send(403, { error: 'Not authorized' });
	} else {
		logger.info(req.url);
		req.session.originalUrl = req.url;
		res.redirect('/login');
	}
}

function andRestrictTo(role) {
  return function(req, res, next) {
    req.user.role == role ? next() : next(new Error('Unauthorized'));
  }
}

app.get('/probe', function(req, res){
	res.send(200, 'Ok');
});
app.get('/login', routes.login);
app.get('/index', ensureAuthenticated, routes.base);
app.get('/callback', 
	passport.authenticate('google', { failureRedirect: '/login' }),
	function(req, res) {
		logger.info('inside authenticate')
		res.redirect('/index');
	}
);
app.get('/redirect', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']}));


app.get('/partials/:name', ensureAuthenticated, routes.partials);

// JSON API

app.get('/api/categories', ensureAuthenticated, api.getCategories);

app.get('/api/items', ensureAuthenticated, api.getItems);
app.get('/api/itemsByCategory', ensureAuthenticated, api.getItemsByCategory);
app.get('/api/itemsArrayByCategory', ensureAuthenticated, api.getItemsArrayByCategory);
app.post('/api/item', ensureAuthenticated, api.addItem);
app.put('/api/item/:id', ensureAuthenticated, api.editItem);
app['delete']('/api/item/:id', ensureAuthenticated, api.deleteItem);

// redirect all others to the index (HTML5 history)
app.get('*', ensureAuthenticated, routes.base);

// Start server

app.listen(process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080, process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0', function(){
	logger.info("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
	console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
