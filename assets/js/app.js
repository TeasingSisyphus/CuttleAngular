(function() {
	var app = angular.module('homepage', []);
	var socket = io.connect('http://localhost:1337');



	app.controller('homepageController', ['$scope', '$http', '$rootScope',
		function($scope, $http, $rootScope) {
			//List of all games currently being played
			this.games = [];

			//Name of the game currently being entered in the form
			//This value is 2-way bound to the text input in homepage.ejs
			this.name = '';

			this.gameView = false;

			//Requests creation of new game, then clears form
			this.createGame = function() {
				console.log('\nForging ahead');
				var gameName = this.name;

				//Request to subscribe socket to the Game Instance
				socket.post('/game/create', {
					name: gameName
				}, function(res) {
					console.log(res);

				});

				this.name = '';

			};

			//Requests to subscribe to a Game instance, then requests
			//The gameView
			this.joinGame = function(id) {
				console.log("Requesting to join game");
				console.log(id);

				//Request to subscribe to the game specified by id
				socket.get('/game/game_subscribe', {
					id: id
				}, function(res) {
					console.log("Recieved response to join game");
					console.log(res);

					//Request view of the game specified by id
					if (res.game.hasOwnProperty('id')) {

						console.log(res.game.id);

						if (res.game.id === id) {
							console.log("Correct ID");

							$scope.homepage.gameView = true;
							console.log($scope.homepage.gameView);
							console.log($scope.game);
							console.log($scope.homepage);
							console.log($scope);

							//emit an event through $rootscope that will trigger a listener defined in gameController
							$rootScope.$emit('gameView', res.game);

							$scope.$apply();

						}

					}
				});
			};

			this.updateAll = function() {
				console.log('requesting updateAll');
				socket.get('/game/update_all', function(res) {
					console.log(res);
				});
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
						case 'updated':
							console.log(obj.data);
					}

					$scope.$apply();

				});

			});
		}
	]); //End of homePageController

	app.controller('viewController', function($scope) {
		this.gameView = false;
	});

	app.controller('gameController', function($scope, $rootScope) {
		this.id = null;
		this.players = [];
		this.deck = [];
		this.scrap = [];
		this.name = '';
		this.turn = 0;

		//This event fires when the homepage receives a game from the server for the first time
		$rootScope.$on('gameView', function(event, game) {
			console.log('gameView fired');
			$scope.game.id = game.id;
			$scope.game.name = game.name;
		});

	}); //End of gameController


})();