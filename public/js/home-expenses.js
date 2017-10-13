'use strict';


// Declare app level module which depends on filters, and services

angular.module('HomeExpensesApp', ['HomeExpensesApp.controllers', 'HomeExpensesApp.directives', 'HomeExpensesApp.filters', 'ui.router', 'ui.bootstrap', 'ngCsv']).
//  config(['$routeProvider', function($routeProvider) {
//	$routeProvider.when('/addItem', {templateUrl: 'partials/addItem', controller: 'AddItemCtrl'});
//	$routeProvider.when('/listItems', {templateUrl: 'partials/listItems', controller: 'ListItemsCtrl'});
//	$routeProvider.when('/adminItems', {templateUrl: 'partials/adminItems', controller: 'AdminItemsCtrl'});
//    $routeProvider.otherwise({redirectTo: '/addItem'});
//  }]).
  config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state({name: 'addItem', url: '/addItem', views: {
        '': {
            templateUrl: 'partials/addItem', 
            controller: 'AddItemCtrl'
        }
    }});  
    $stateProvider.state({name: 'listItems', url: '/listItems', views: {
        '': {
            templateUrl: 'partials/listItems', 
            controller: 'ListItemsCtrl'
        }
    }});
    $stateProvider.state({name: 'adminItems', url: '/adminItems',views: {
        '': {
            templateUrl: 'partials/adminItems', 
            controller: 'AdminItemsCtrl'
        }
    }});
    $stateProvider.state({name: 'graph', url: '/graph',views: {
        '': {
            templateUrl: 'partials/graph', 
            controller: 'GraphCtrl'
        }
    }});
    $urlRouterProvider.otherwise("/addItem");
  }]).
  config(['$httpProvider', '$compileProvider', function ($httpProvider, $compileProvider) {
//	$httpProvider.defaults.headers.common['Content-type'] = 'application/json;charset=UTF-8';
	var elementsList = jQuery();
	
	var showMessage = function(content, cl, time) {
            jQuery('<div/>')
                .addClass('message')
                .addClass(cl)
                .hide()
                .fadeIn('fast')
                .delay(time)
                .fadeOut('fast', function() { jQuery(this).remove(); })
                .appendTo(elementsList)
                .text(content);
			
        };
        $httpProvider.interceptors.push(function($timeout, $q) {
            return {
                'response': function(response){
                    if (response.config.method.toUpperCase() != 'GET')
                        showMessage('Success', 'successMessage', 5000);
                    return response;
                },
                'responseError': function(rejection) {
                     switch (rejection.status) {
                        case 401:
                            showMessage('Wrong usename or password', 'errorMessage', 20000);
                        	$rootScope.$broadcast('event:no-session', {});
                        	break;
                        case 403:
                            showMessage('You don\'t have the right to do this', 'errorMessage', 20000);
                            break;
                        case 500:
                            showMessage('Server internal error: ' + rejection.data.error, 'errorMessage', 20000);
                            break;
                        default:
                            showMessage('Error ' + rejection.status + ': ' + rejection.data.error, 'errorMessage', 20000);
                           break;
                    }
                    return $q.reject(rejection)
                }
            };
        });
        $compileProvider.directive('appMessages', function() {
            var directiveDefinitionObject = {
                link: function(scope, element, attrs) { elementsList.push(jQuery(element)); }
            };
            return directiveDefinitionObject;
        });
  }]).
  config(['$locationProvider', function ($locationProvider) {
//	$locationProvider.html5Mode(false).hashPrefix('!');
      $locationProvider.html5Mode({enabled: false, requireBase: false});
  }]);
  

"use strict";

/* Directives */


angular.module('HomeExpensesApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]).
  directive('refreshList', function(){
	return{
		restrict: 'A',
		link: function(scope, element, attrs){
			//jQuery(element).closest(':jqmData(role=listview)').listview('refresh');   
			jQuery('li').removeClass('ui-li-static');   
		}
	};            
  })//
  .directive('ngBlur', ['$parse', function($parse) {
	  return function(scope, element, attr) {
	    var fn = $parse(attr['ngBlur']);
	    element.bind('blur', function(event) {
	      scope.$apply(function() {
	        fn(scope, {$event:event});
	      });
	    });
	  };
  }])
  .directive('smaTypeahead2', ['$parse', '$log', function($parse, $log) {

	return {
		restrict: 'A',
		require: '?ngModel',
		link: function postLink(scope, element, attrs, controller) {

			var getter = $parse(attrs.smaTypeahead),
					setter = getter.assign,
					value = getter(scope);

			// Watch bsTypeahead for changes
			scope.$watch(attrs.smaTypeahead, function(newValue, oldValue) {
				if(newValue !== oldValue) {
					value = newValue;
				}
			});
			
//			element.bind("keydown keypress", function(event) {
//				if(event.which === 13) {
//					scope.$apply(function(){
//						scope[attrs.typeaheadUpdaterFunction]({name: element.val(), category: 'Unknown'});
//                    });
//					$log.log('kkota 2');
//                    event.preventDefault();
//                }
//            });
            
            element.attr('data-provide', 'typeahead');
			element.typeahead({
				source: function(query) { return angular.isFunction(value) ? value.apply(null, arguments) : value; },
				minLength: attrs.minLength || 1,
				items: attrs.items,
				updater: function(value) {
					//$log.log('kkota');
					// If we have a controller (i.e. ngModelController) then wire it up
					if(controller && attrs.typeaheadUpdaterFunction) {
						scope.$apply(function () {
							scope[attrs.typeaheadUpdaterFunction](value);
						});
					}
					return '';
//					return value;
				}
			});

			// Bootstrap override
			var typeahead = element.data('typeahead');
			// Fixes #2043: allows minLength of zero to enable show all for typeahead
			
			typeahead.$button = jQuery(jQuery.fn.typeahead.defaults.button);
			
			typeahead.$button.bind('click', function(event) {
				scope.$apply(function(){
					scope[attrs.typeaheadUpdaterFunction]({name: element.val(), category: 'Unknown', quantity: 1});
				});
			});
			
			typeahead.lookup = function (ev) {
				var items;
				this.query = this.$element.val() || '';
				if (this.query.length < this.options.minLength) {
					return this.shown ? this.hide() : this;
				}
				items = jQuery.isFunction(this.source) ? this.source(this.query, jQuery.proxy(this.process, this)) : this.source;
				return items ? this.process(items) : this;
			};
			
			typeahead.matcher = function (item) {
				return item.name.toLowerCase().slice(0, this.query.length) === this.query.toLowerCase();
			};
			
			typeahead.highlighter = function (item) {
				return item.name;
			};
			
			typeahead.render = function (items) {
				var that = this;

				items = jQuery(items).map(function (i, item) {
					i = jQuery(that.options.item).attr('data-value', JSON.stringify(item));
					i.find('a').html(that.highlighter(item));
					return i[0];
				});

				items.first().addClass('active');
				this.$menu.html(items);
				return this;
			};
			
			typeahead.select = function () {
				var val = JSON.parse(this.$menu.find('.active').attr('data-value'));
				this.$element
					.val(val.name)
					.change();
				this.updater(val);
				return this.hide();
			};
			
			typeahead.sorter = function (items) {
				var beginswith = [], 
				caseSensitive = [],
				caseInsensitive = [],
				item;

				while (item = items.shift()) {
					if (!item.name.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item);
					else if (~item.name.indexOf(this.query)) caseSensitive.push(item);
					else caseInsensitive.push(item);
				}

				return beginswith.concat(caseSensitive, caseInsensitive);
			};
			
			typeahead.show = function () {
				var pos = jQuery.extend({}, this.$element.position(), {
					height: this.$element[0].offsetHeight
				});

				
				this.$menu
					.insertAfter(this.$element)
					.css({
						top: pos.top + pos.height,
						left: pos.left
					})
					.show();

				this.$button
					.insertAfter(this.$element)
					.css({
						top: '18px'
					})
					.show();

				this.shown = true;
				return this;
			};
			
			// Support 0-minLength
			if(attrs.minLength === "0") {
				setTimeout(function() { // Push to the event loop to make sure element.typeahead is defined (breaks tests otherwise)
					element.on('focus', function() {
						setTimeout(element.typeahead.bind(element, 'lookup'), 200);
					});
				});
			}

		}
	};

  }]).
  directive('smaTypeahead', ['$compile', '$log', function($compile, $log) {
	return {
		restrict: 'A',
		scope: {
			datasets: '=',
            eventHandler: '&ngClick'
		},
		compile: function (element, attrs) {
			var template = angular.element('<span class="input-group-btn"><button class="btn btn-primary glyphicon glyphicon-ok-sign" ng-click="eventHandler()" /></span>');
			var lik = $compile(template);
			return  function (scope, element) {
				element.typeahead(scope.datasets);
				jQuery('.twitter-typeahead').addClass('input-group').css('display', 'table');
				jQuery('.tt-hint').addClass('form-control');
				jQuery('.tt-query').addClass('form-control').after(lik(scope));
			};
		}
	};
  }]).
    directive('smaPopover', ['$compile', '$log', function($compile, $log) {
	return {
		restrict: 'A',
		scope: {
			value: '=',
			listClick: '&'
		},
		transclude: false,
		compile: function (element, attrs) {
			var template = '<div id="supermarkets" class="list-group"><button class="list-group-item" ng-repeat="supermarket in value" ng-click="selectSupermarket()">{{ supermarket.name }}</button></div>';
			var compTpl = $compile(template);
			return  function (scope, element) {	
				element.popover({
					html: true,
					content: function() {
						return template;
					},
					placement: 'bottom'
				}).click( function(e){
					$compile(jQuery('.popover').contents())(scope);
				});
			};
		}
	};
  }]).
    directive('smaPopover2', ['$log', '$parse', '$compile', '$http', '$timeout', '$q', '$templateCache', function($log, $parse, $compile, $http, $timeout, $q, $templateCache) {
	// Hide popovers when pressing esc
	jQuery('body').on('keyup', function(ev) {
		if(ev.keyCode === 27) {
			jQuery('.popover.in').each(function() {
				jQuery(this).popover('hide');
			});
		}
	});
	return {
		restrict: 'A',
    scope: false,
    compile: function (element, attr){
		var template = angular.element('#' + attr.contentRef)[0].innerHTML;
		return function postLink(scope, element, attr, ctrl) {

      var getter = $parse(attr.bsPopover),
        setter = getter.assign,
        value = getter(scope),
        options = {};

      if(angular.isObject(value)) {
        options = value;
      }

		//var template = '<div id="supermarkets" class="list-group"><button class="list-group-item" ng-repeat="supermarket in supermarkets" ng-click="selectSupermarket(supermarket.name)">{{ supermarket.name }}</button></div>';
		
        // Handle response from $http promise
        if(angular.isObject(template)) {
          template = template.data;
        }

        // Handle data-unique attribute
        if(!!attr.unique) {
          element.on('show', function(ev) { // requires bootstrap 2.3.0+
            // Hide any active popover except self
            jQuery('.popover.in').each(function() {
              var $this = jQuery(this),
                popover = $this.data('popover');
              if(popover && !popover.$element.is(element)) {
                $this.popover('hide');
              }
            });
          });
        }

        // Handle data-hide attribute to toggle visibility
        if(!!attr.hide) {
          scope.$watch(attr.hide, function(newValue, oldValue) {
            if(!!newValue) {
              popover.hide();
            } else if(newValue !== oldValue) {
              $timeout(function() {
                popover.show();
              });
            }
          });
        }

        if(!!attr.show) {
          scope.$watch(attr.show, function(newValue, oldValue) {
            if(!!newValue) {
              $timeout(function() {
                popover.show();
              });
            } else if(newValue !== oldValue) {
              popover.hide();
            }
          });
        }

        // Initialize popover
        element.popover(angular.extend({}, options, {
          content: template,
          html: true,
          placement: 'bottom'
        }));

        // Bootstrap override to provide tip() reference & compilation
        var popover = element.data('bs.popover');
        popover.hasContent = function() {
          return this.getTitle() || template; // fix multiple $compile()
        };
        popover.getPosition = function() {
          var r = jQuery.fn.popover.Constructor.prototype.getPosition.apply(this, arguments);

          // Compile content
          $compile(this.$tip)(scope);
          scope.$digest();

          // Bind popover to the tip()
          this.$tip.data('bs.popover', this);

          return r;
        };

        // Provide scope display functions
        scope.$popover = function(name) {
          $log.log(name);
          popover(name);
        };
        angular.forEach(['show', 'hide'], function(name) {
          scope[name] = function() {
            popover[name]();
          };
        });
        scope.dismiss = scope.hide;

        // Emit popover events
        angular.forEach(['show.bs.popover', 'shown.bs.popover', 'hide.bs.popover', 'hidden.bs.popover'], function(name) {
          element.on(name, function(ev) {
            scope.$emit('popover-' + name, ev);
            if(name==='hidden.bs.popover') {
				popover.$tip.css('display','none');
            }
          });
        });

	};

    }
    };
  }]).  
  directive('graph', ['$log', function($log) {
      return {
		restrict: 'E',
		scope: {
            data: '=',
            options: '='
        },
        link: function(scope, element, attrs) {
            scope.$watch('data', function(data){
                if(!scope.options) return;

                var svg = d3.select(element[0])
                    .append("svg")
                    .attr("width", 960)
                    .attr("height", 500),
                    margin = {top: 20, right: 80, bottom: 30, left: 50},
                    width = svg.attr("width") - margin.left - margin.right,
                    height = svg.attr("height") - margin.top - margin.bottom,
                    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var parseTime = d3.timeParse("%Y%m%d");

                var x = d3.scaleTime().range([0, width]),
                    y = d3.scaleLinear().range([height, 0]),
                    z = d3.scaleOrdinal(d3.schemeCategory10);

                var line = d3.line()
                    .curve(d3.curveBasis)
                    .x(function(d) { return x(d[scope.options.keys.x]); })
                    .y(function(d) { return y(d[scope.options.keys.y]); });

                x.domain(scope.options.ranges.x);
                y.domain(scope.options.ranges.y);
                z.domain(scope.options.titles);

                g.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x));

                g.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", "0.71em")
                    .attr("fill", "#000")
                    .text(scope.options.titles.y);

                var city = g.selectAll(".city")
                    .data(data)
                    .enter().append("g")
                    .attr("class", "city");

                city.append("path")
                    .attr("class", "line")
                    .attr("d", function(d) { return line(d.values); })
                    .style("stroke", function(d) { return z(d.id); });

                city.append("text")
                    .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
                    .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.price) + ")"; })
                    .attr("x", 3)
                    .attr("dy", "0.35em")
                    .style("font", "10px sans-serif")
                    .text(function(d) { return d.id; });
            });
        }
      };
  }]);'use strict';

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
	}]);'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('HomeExpensesApp.services', []).
  factory('ItemServices', ['$log', '$http', '$q', '$rootScope', function($log, $http, $q, $rootScope) {
	return {
		addItem: function(item, callback) {
			$http.post('/api/item/', {item: item}).
				success(function (data) {
//					$log.log('kkota');
					callback();
				});
		},
		getCategories: function(callback) {
			$http.get('/api/categories/').
				success(function (data) {
//					$log.log('kkota');
					callback(data);
				});
		},
		listItems: function(callback) {
			$http.get('/api/items/').
				success(function (data) {
//					$log.log('kkota');
					callback(data.items);
				});
		},
		removeItem: function(id, callback) {
			$http['delete']('/api/item/' + id).
				success(function (data) {
//					$log.log('kkota');
					callback(data);
				});
		},
		getGroupedItemsByDate: function(date, callback) {
			var start = moment(date).startOf('month').format('YYYY-MM-DD');
			var end = moment(date).add(1, 'M').startOf('month').format('YYYY-MM-DD');
			$http.get('/api/itemsByCategory', {params: {from: start, to: end}}).
				success(function (data) {
//					$log.log('kkota');
					callback(data);
				});
		},
        getItemsArrayGroupedByCategory: function(date, callback) {
			var start = moment(date).startOf('year').format('YYYY-MM-DD');
			var end = moment(date).add(1, 'Y').startOf('year').format('YYYY-MM-DD');
			$http.get('/api/itemsArrayByCategory', {params: {from: start, to: end}}).
				success(function (data) {
//					$log.log('kkota');
					callback(data);
				});
		}
		
	};
  }]);