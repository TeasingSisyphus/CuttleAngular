(function(){
	var app = angular.module('homepage', []);
	var socket = io.connect('http://localhost:1337');

////////////////
//Socket Stuff//
////////////////


	app.controller('homepageController', function($scope) {
		this.games = [];
		this.name  = '';

		this.createGame = function() {
			console.log('\nForging ahead');
			var gameName = this.name;

			socket.post('/game/create', {
				name: gameName
			}, function(res) {
				console.log(res);
			});

			this.name = ''; 

		};

		/*  $('#gameForm').on('submit', function (){
			console.log('submit');
			console.log(this.name);
		});  */

		this.games.push(gameOne);
		this.games.push(gameTwo);


		var self = this;
		console.log(self);
		socket.on('connect', function() {
			socket.get('/game/subscribe', function(res) {
				console.log(res);
			});

			$scope.$apply(socket.on('game', function(obj) {
				console.log(self);
				console.log('\nlogging scope:');
				console.log($scope);
				switch (obj.verb) {
					case 'created':
						console.log(obj.data);
						$scope.homepage.games.push(obj.data);
						console.log($scope.homepage.games);
						break;
				}
			}));

		});
	});
})();



		var Game = function() {
			this.status = true;
			this.name = '';
		};

		var gameOne = new Game();
		var gameTwo = new Game();

		gameOne.name = 'DatGame';
		gameTwo.name = 'Aww yiss';
