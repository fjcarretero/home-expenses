'use strict';

/* Filters */

angular.module('HomeExpensesApp.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]).
  filter('countPending', [ function() {
    return function(items) {
      
      return _.reduce(items, function (memo, item) {
         return item.purchased ? memo: memo + 1;
      }, 0);
    };
  }]).
  filter('sumPrices', [ function() {
    return function(items) {
      
      return _.reduce(items, function (memo, item) {
         return memo + item.price;
      }, 0);
    };
  }]).
  filter('orderObjectBy', ['$log', '$filter', function($log, $filter){
	return function(input, order) {
       if (!order) return input;
		$log.log('orderObjectBy');
        var output = [],
			supermarketCategories,
			uk,
			tmp,
			end = [];
		
		supermarketCategories = order.categories;
		
		_.each(supermarketCategories, function (category) {
			tmp = _.filter(input, function (cat) {
					return cat.category === category;	
				})[0];
				
			if (tmp) {
				if ($filter('countPending')(tmp.items)>0) {
					output.push(tmp);
				} else {
					end.push(tmp);
				}
			} 
		});
		
		uk = _.filter(input, function (cat) {
			return cat.category === 'Unknown';
		})[0];
		if(uk){
			output.push(uk);
		}
		
		if (end.length > 0) {
			output = output.concat(end);
		}
						
		return output;
    };
  }]).
  filter('groupByCategory', ['$log', '$filter', function($log, $filter){
	return function(input) {
		$log.log('groupByCategory');
        
        return _.groupBy(input, 'category');
    };
  }]).
  filter('formatDate', ['$log', function($log){
	return function(input) {
//		return input.substring(0,10);
		return moment(input, 'YYYY-MM-DD').format('DD/MM/YYYY');
    };
  }]).
  filter('formatPrice', ['$log', function($log){
	return function(input) {
		return Number((input/100).toFixed(2)).toLocaleString();
    };
  }]);
