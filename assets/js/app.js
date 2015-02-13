(function(){
	var app = angular.module('homepage', []);
	var socket = io.connect('http://localhost:1337');



	app.controller('homepageController', function($scope) {
		//List of all games currently being played
		this.games = [];

		//Name of the game currently being entered in the form
		//This value is 2-way bound to the text input in homepage.ejs
		this.name  = '';

		//Requests creation of new game, then clears form
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

		////////////////
		//Socket Stuff//
		////////////////

		//When the socket connects, request to subscribe to the Game class room
		//This will enable notifications when a Game is created, or destroyed
		socket.on('connect', function() {
			socket.get('/game/subscribe', function(res) {
				res.forEach(function(game, index, games) {
					$scope.homepage.games.push(game);
				});
				console.log($scope.homepage.games);
				$scope.$apply();
			});

			//'game' model events signify that a game was created, destroyed,
			//or updated
			socket.on('game', function(obj) {
				//obj.verb is a string signifying the type of model event
				switch (obj.verb) {
					//If a game was created, update hompageController.games
					case 'created':
						console.log(obj.data);
						$scope.homepage.games.push(obj.data);
						console.log($scope.homepage.games);
						break;
				}

				$scope.$apply();

			});

		});
	});
})();

