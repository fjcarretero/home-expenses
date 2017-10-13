"use strict";

/* Controllers */

angular.module('HomeExpensesApp.controllers', ['HomeExpensesApp.services']).
	controller('AddItemCtrl', ['$scope', '$log', 'ItemServices', function ($scope, $log, ItemServices) {	
		ItemServices.getCategories( function(categories) {
			$scope.categoryList = categories.categories;
		});
		
		$scope.init = function() {
			$log.log(moment.locale());
            $scope.item = {
//				dateFormat: 'DD/MM/YYYY',
				date: new Date()
			};
		};
				
		$scope.init();
		
		$scope.addItem = function() {
//			$scope.item.price = $scope.item.priceStr.replace(/,/g, '');
            $scope.item.price = Math.floor($scope.item.priceStr * 100);
//			$scope.item.date = moment($scope.item.date, 'YYYY-MM-DD').format('DD/MM/YYYY');
			ItemServices.addItem($scope.item, function() {
				$scope.init();
			});
		};
		
		$scope.validatePrice = function () {
			var i,
				newValue = $scope.item.priceStr;
			if(!newValue) return;
			if ((i = newValue.indexOf(',')) <= 0) {
				$scope.item.priceStr = newValue + ',00';	
			} else {
				$scope.item.priceStr = newValue;
			}
		};
		
		$scope.open = function($event) {
			$event.preventDefault();
			$event.stopPropagation();
			
			$scope.opened = true;
		};
		
		$scope.dateOptions = {
			'starting-day': 1
		};
	}]).
	controller('ListItemsCtrl', ['$scope', '$log', 'ItemServices', function ($scope, $log, ItemServices) {	
		
//		$scope.filterDate = new Date();
		$scope.header = [];
		$scope.data = [];
		
		$scope.dateList = [];
		var m;
		for(var i=0;i<6;i++){
			m = moment().subtract(i, 'M');
			$scope.dateList.push({val: new Date(m.format('D MMMM, YYYY')), text: m.format('MM/YYYY')});
//			$scope.dateList.push(m.format('MM/YYYY'));
		}
		
		$scope.filterDate = $scope.dateList[0];
		
		$scope.init = function() {
			ItemServices.getGroupedItemsByDate($scope.filterDate.val, function(data) {
				$scope.groupedItems = data.items;
				$scope.header = _.keys($scope.groupedItems);
				var tmp = [];
				var it;
				_.each($scope.groupedItems, function(items, key) {
					it = _.reduce(items, function (memo, item) {
							return memo + item.price/100;
					}, 0);
					tmp.push(Number(it.toFixed(2)).toLocaleString());
				});
				
				$scope.data = [tmp];
			});
		};
		
		$scope.init();

		$scope.$watch('filterDate', function(newValue){
			$scope.init();
		});
	}]).
	controller('AdminItemsCtrl', ['$scope', '$log', 'ItemServices', function ($scope, $log, ItemServices) {	
		
		$scope.init = function() {
			ItemServices.listItems(function(data) {
				$scope.items = data;
			});
		};
		
		$scope.removeItem = function(id) {
			$log.log(id);
			ItemServices.removeItem(id, function() {
				$scope.init();
			});
			
		};
				
		$scope.init();
	}]).
	controller('GraphCtrl', ['$scope', '$log', 'ItemServices', function ($scope, $log, ItemServices) {	
		
        var parseTime = d3.timeParse("%Y-%m-%d");
        
		$scope.init = function() {
			ItemServices.getItemsArrayGroupedByCategory(parseTime("2016-10-20"), function(data) {
				$scope.data = _.map(data.items, function(item) {
                    return {
                        id: item.id,
                        values: _.map(item.values, function(value){
                            return {
                                date: parseTime(value.date),
                                price: value.price/100
                            }
                        })
                    }
                });
                var maxArray = [],
			minArray = [];
                
                _.each($scope.data, function (obj){
                    maxArray.push(
                        (_.max(obj.values, function(value){
                            return value.price;
                        })).price
                    );
		    minArray.push(
                        (_.min(obj.values, function(value){
                            return value.date;
                        })).date
                    );

                });
                $scope.options={
                    ranges: {
                        x: [_.min(minArray), new Date()],
                        y: [0, _.max(maxArray)]
                    },
                    keys: {
                        x: 'date',
                        y: 'price'
                    },
                    titles: {
                        lines: _.keys($scope.data),
                        y: "Euros"
                    }
                };
            });
		};
						
		$scope.init();
	}]);