/*
 * Serve JSON to our AngularJS client
 */
var _ = require('underscore'),
	logger = require('../winston'),
	moment = require('moment');

exports.addItem = function (req, res, next) {
		
  logger.info('Create Item');
  logger.silly('name=' + req.body.item.name);
  logger.silly('price=' + req.body.item.price);
  logger.silly('date=' + req.body.item.date);
  logger.silly('category=' + req.body.item.category);
  logger.silly('email=' + req.user.email);
  logger.silly('familyId=' + req.user.familyId);
  
   var item = new Item,
   		m = moment(req.body.item.date);
  
  item.email = req.user.email;
  item.familyId = req.user.familyId;
  item.name = req.body.item.name;
//  item.date = new Date(m.format('D MMMM, YYYY'));
  item.date = transformDate(req.body.item.date);
  item.price = req.body.item.price;
  item.category = req.body.item.category;
  item.save(function (error){
    if (error) {
		logger.error('Error saving item %s. Error: %s', req.body.item, error);
		next(new Error('Gasto duplicado'));
	} else {
	  logger.silly('item=' + item);
	  res.json(req.body);
	}
  });
};

exports.getItems = function (req, res, next) {
//	var items1;
	logger.info('Get Items ' + req.user.familyId);
	Item.find({familyId: req.user.familyId}).lean().exec(function(err, items) {
		if (err) { next(err); }
		if(items) {
//			items1 = items.map(function(item){
//				logger.silly('name=' + item.name + ',date=' + item.date + ',price=' + item.price);
//				return item;
//			});
//			logger.info('L=' + items1);
			res.json({
				items: _.map(items, function(item){
                    item.date = moment(item.date).format('YYYY-MM-DD');
//                    logger.silly(item);
                    return item;
                })
			});
		} else {
			logger.warn('No item found');
		}
	});
};

exports.editItem = function (req, res, next) {
	logger.info('Edit Item' +  req.params.id);
	logger.info(req.body.item);
	Item.findOne({_id:  req.params.id, email: req.user.email}, function (err, item) {
		if (err) { next(err); }
		if (item) {
			item.email = req.user.email;
  			item.name = req.body.item.name;
  			item.price = req.body.item.price;
  			item.category = req.body.item.category;
			item.save(function (error){
				if (error) {
					logger.error('Error saving item %s. Error: %s', req.params.id, error);
					next(new Error(error));
				}
			});
		} else {
			next(new Error('Item not found ' + req.params.id));
		}
	});
};

exports.deleteItem = function (req, res, next) {
	logger.info('Delete Item' + req.params.id);
	Item.findOne({_id: req.params.id, familyId: req.user.familyId }, function (err, item) {
		if (err) { next(err); }
		if (item){
			item.remove(function (error) {
				logger.error('Error deleting item %s. Error: %s', req.params.id, error);
				next(new Error('Error deleting item %s. Error: %s', req.params.id, error));
			});
			res.send({status: 'Ok'});
		} else {
			next(new Error('Item not found ' + req.params.id));
		}
	});
};

exports.getCategories = function (req, res, next) {
	logger.info('Get Categories');
	res.json({
		categories: Item.schema.path('category').enumValues
	});
};

exports.getItemsByCategory = function (req, res, next) {
	logger.info('Get Items grouped by categories from ' + transformDate(req.query.from) + ' to ' + transformDate(req.query.to));
	Item.find({familyId: req.user.familyId, date: {'$gte': transformDate(req.query.from), '$lt': transformDate(req.query.to)} }).lean().exec(function(err, items) {
		if (err) { next(err); }
		if(items) {
			res.json({
				items: _.groupBy(_.map(items, function(item){
                    item.date = moment(item.date).format('YYYY-MM-DD');
                    return item;
                }), 'category')
			});
		} else {
			logger.warn('No items found');
		}
	});
};

exports.getItemsArrayByCategory = function (req, res, next) {
	logger.info('Get Items grouped by categories from ' + transformDate(req.query.from) + ' to ' + transformDate(req.query.to));
	Item.find({familyId: req.user.familyId, date: {'$gte': transformDate(req.query.from), '$lt': transformDate(req.query.to)} }).lean().exec(function(err, items) {
		if (err) { next(err); }
		if(items) {
			res.json({
				items: convert2Array(_.groupBy(_.map(items, function(item){
                    item.date = moment(item.date).format('YYYY-MM-DD');
                    return item;
                }), 'category'))
			});
		} else {
			logger.warn('No items found');
		}
	});
};

var transformDate2 = function(str) {
	var m = moment(str, 'DD/MM/YYYY');
	return new Date(m.format('D MMMM, YYYY'))
};

var transformDate = function(str) {
	var m = moment(str, 'YYYY-MM-DD');
	return m.toDate();	
};

var convert2Array = function(obj) {
    var keys = _.keys(obj);

    return _.map(keys, function(key){
       return {
           id: key,
           values: obj[key]
       } 
    });
};