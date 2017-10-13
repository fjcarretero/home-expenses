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
  
