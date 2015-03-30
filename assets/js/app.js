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


				//Request to subscribe to the game specified by id
				socket.get('/game/game_subscribe', {
					id: id
				}, function(res) {
					console.log("Recieved response to join game");
					console.log(res);

					if (res.hasOwnProperty('game')) {

						//Request view of the game specified by id
						if (res.game.hasOwnProperty('id')) {



							if (res.game.id === id) {

								$scope.homepage.gameView = true;


								//emit an event through $rootscope that will trigger a listener defined in gameController
								$rootScope.$emit('gameView', res.game);

								$scope.$apply();

							}

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
				socket.on('gamedisplay', function(obj) {
					console.log('\ngamedisplay event fired');
					//obj.verb is a string signifying the type of model event
					switch (obj.verb) {
						//If a game was created, add it to homepage's list of games
						case 'created':
							console.log('GameDisplay created: ');
							console.log(obj.data);
							$scope.homepage.games.push(obj.data);
							break;
							//If a GameDisplay was updated, find which and update it in the list
						case 'updated':
							console.log('GameDisplay updated: ');
							console.log(obj.data);

							var foundIt = false;
							$scope.homepage.games.forEach(
								function(game, index, games) {
									if (game.gameId === obj.data.gameId) {
										game.status = obj.data.status;
										foundIt = true;
									}
								});

							//If updated game is not found in homepage game list, append it
							if (!foundIt) {
								$scope.homepage.games.push(obj.data);
							}
							break;

					}

					$scope.$apply();

				});

			});
		}
	]); //End of homePageController


	app.controller('gameController', function($scope, $rootScope) {
		this.id = null;
		this.players = [];
		this.deck = [];
		this.scrap = [];
		this.name = '';
		this.turn = 0;
		this.playerNum = null;
		this.selImg = 'images/word-ace-card-back.jpg';
		this.selIndex = null;
		this.selected = false;

		/////////////////////
		//Root Scope Events//
		/////////////////////
		/*
		 *These are Angular Events Used to Communicate Between Controllers
		 */

		//This event fires when the homepage receives a game from the server for the first time
		//The $rootScope.$emit is defined in homepageController.joinGame()
		$rootScope.$on('gameView', function(event, game) {
			console.log('gameView fired');
			$scope.game.id = game.id;
			$scope.game.name = game.name;
			$scope.game.deck = game.deck;
			$scope.game.playerNum = game.players.length;
			console.log($scope.game.playerNum);
		});


		//////////////////////
		//Controller Methods//
		//////////////////////

		this.deal = function() {
			console.log('Requesting deal');
			socket.get('/game/deal', {
					id: $scope.game.id
				},
				function(res) {
					console.log(res);
				});
		};

		this.shuffle = function() {
			console.log('Requesting shuffle');
			socket.get('/game/shuffle', {
					id: $scope.game.id
				},
				function(res) {
					console.log(res);
				});
		};

		this.draw = function() {
			console.log('Requesting draw');
			socket.get('/game/draw', {
					id: $scope.game.id
				},
				function(res) {
					console.log(res);
				});
		};

		//Selects/deselects one of your cards and displays it in the middle of the screen
		this.sel = function(index) {
			if ($scope.game.selIndex !== index) {
				console.log("\nSelecting card " + index + " from hand");

				$scope.game.selImg = $scope.game.players[$scope.game.playerNum].hand[index].img;
				$scope.game.selIndex = index;
				$scope.game.selected = true;
			} else {
				console.log('\nDeselcting');
				$scope.game.selImg = 'images/word-ace-card-back.jpg';
				$scope.game.selIndex = null;
				$scope.game.selected = false;

			}
		};

		//Requests playing a card specified by game.selIndex to your field
		this.toField = function() {
			if ($scope.game.selected) {
				console.log("\nCard " + $scope.game.selIndex + " is selcted; requesting to move to field");
				socket.get('/game/toField', {
						id: $scope.game.id,
						index: $scope.game.selIndex
					},
					function(res) {
						console.log(res);
						console.log("Deselecting after toField");
						$scope.game.selIndex = null;
						$scope.game.selected = false;
						$scope.game.selImg = 'images/word-ace-card-back.jpg';
						$scope.$apply();
					});
			}
		};

		//Requests scuttling an opponent's card with one from your hand (both will be scrapped)
		this.scuttle = function(target_index) {
			if ($scope.game.selected) {
				console.log("\nRequesting to scuttle card " + target_index + " with card " + $scope.game.selIndex + " from hand");
				socket.get('/game/scuttle', {
						id: $scope.game.id,
						index: $scope.game.selIndex,
						target: target_index
					},
					function(res) {
						console.log(res);
						console.log("Deselecting after scuttle");
						$scope.game.selIndex = null;
						$scope.game.selected = false;
						$scope.game.selImg = 'images/word-ace-card-back.jpg';
						$scope.$apply();
					});
			}
		};

		socket.on('game', function(obj) {
			console.log('\nGame event fired');
			switch (obj.verb) {
				case 'updated':
					if (obj.data.hasOwnProperty('game')) {
						console.log("Got a game");
						console.log(obj.data.game);
						console.log(obj.data.game.winner);
						console.log((obj.data.game.winner === 0) || (obj.data.game.winner === 1));
						if ((obj.data.game.winner === 0) || (obj.data.game.winner === 1)) {
							alert("Player " + obj.data.game.winner + " has won!");
						}

					}
					console.log('Game was updated; logging data: ');
					console.log(obj.data);
					if (obj.data.hasOwnProperty('players')) {
						$scope.game.players = obj.data.players;
					}
					if (obj.data.hasOwnProperty('deck')) {
						$scope.game.deck = obj.data.deck;
					}
					if (obj.data.hasOwnProperty('scrap')) {
						$scope.game.scrap = obj.data.scrap;
					}

			}
			$scope.$apply();
		});

	}); //End of gameController


})();