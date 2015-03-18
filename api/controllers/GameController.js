/**
 * GameController
 *
 * @description :: Server-side logic for managing Games
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

//////////////////////
//Object Definitions//
//////////////////////
var PlayerTemp = function() {
	this.playerNumber = null;
	this.socketId = '';
	this.hand = [];
	this.field = [];
}

////////////////////////
//Function Definitions//
////////////////////////

//Sort a deck according to the index attributes of its cards
//Makes no change to deck, but returns a sorted deck array
var sortDeck = function(deck) {
	var tempDeck = [];

	for (i=0; i<deck.length; i++) {
		//If the index of the card is less than tempDeck.lengh, 
		//put it in its place in tempDeck
		if (deck[i].index <= tempDeck.length) {
			tempDeck[deck[i].index] = deck[i];
		//Otherwise, put it at the end of tempdeck
		} else {
			tempDeck[tempDeck.length] = deck[i];
		}
	}

	return tempDeck;
};



module.exports = {
	//This action subscribes a socket to the Game class room, then
	//responds with an array of partial Game objects
	subscribe: function(req, res) {
		if (req.isSocket) {
			console.log('subscribing socket: ' + req.socket.id +
				'to GameDisplay class room');
			GameDisplay.watch(req);
			GameDisplay.find().exec(function(err, games) {
				var gameList = [];
				games.forEach(
					function(game, index, games) {
						gameList.push({
							name: game.name,
							gameId: game.gameId,
							status: game.status,
							playerLimit: game.playerLimit
						});
					});

				res.send(gameList);

			});
		}
	},

	//Creates a new game and publishes creation to all sockets subscribed
	//to the Game class room
	create: function(req, res) {
		console.log('creating Game\n');
		console.log(req.body);
		Game.create({
			name: req.body.name
		}).exec(function(err, newGame) {
			console.log('\nCreated game: ' + newGame.name +
				', with ID: ' + newGame.id);

			console.log(newGame);

			if (err || !newGame) {
				res.send(404);
			} else {

				GameDisplay.create({
					name: newGame.name,
					gameId: newGame.id,
					playerLimit: newGame.playerLimit

				}).exec(function(e, newDisplay) {

					GameDisplay.publishCreate({
						name: newDisplay.name,
						gameId: newDisplay.gameId,
						status: newDisplay.status,
						playerLimit: newDisplay.playerLimit
					});

					//This is causing extremely POOR PERFORMANCE
					for (suit = 0; suit <= 3; suit++) {
						for (rank = 1; rank <= 13; rank++) {
							var path = 'images/cards/card_' + suit + '_' + rank + '.png';
							//TODO: Use switch statements to flesh out alt text
							var txt = rank + ' of ' + suit;
							Card.create({
								suit: suit,
								rank: rank,
								index: 13 * suit + rank,
								img: path,
								alt: txt,
							}).exec(
								function(cardError, card) {
									if (cardError || !card) {
										console.log("Card not created for game " + newGame.id);
									} else {
										newGame.deck.add(card.id);
										newGame.save();
									}
								})
						}
					} //End of for loops
				});

			}
		});
	},

	//Subscribes a socket to a Game instance using provided
	//id of requested game
	gameSubscribe: function(req, res) {
		//If request came through socket and has an 'id' param,
		//query for the Game
		if (req.isSocket && req.body.hasOwnProperty('id')) {
			console.log('\ngameSubscribe called by socket ' + req.socket.id + ' for game ' + req.body.id);
			Game.findOne(req.body.id).populate('players').populate('deck').exec(
				function(err, foundGame) {

					if (err || !foundGame) {
						console.log("Game not found");
						res.send(404);
					} else if (foundGame.players.length < foundGame.playerLimit && foundGame.status === true) {

						//console.log("\nlogging game");
						//console.log(foundGame);

						//Check if this player is first to join game
						var playerNum = (foundGame.players.length);
						console.log('Game has ' + playerNum + ' players before new player joins');
						//Create new player
						Player.create({
							playerNumber: playerNum,
							socketId: req.socket.id,
							//currentGame: foundGame
						}).exec(
							function(err, newPlayer) {
								foundGame.players.add(newPlayer.id);
								foundGame.save();
								console.log("\ncreated new player for game: " + foundGame.id);
								console.log(newPlayer);

								console.log('\nsubscribing socket ' + req.socket.id + ' to game: ' + foundGame.id);

								//Subscribe the requesting socket to the requested Game
								//The socket will now be notified whenever publishUpdate() or publishDestroy() are used
								//to announce changes to the model
								Game.subscribe(req.socket, foundGame);

								//If the new player fills the game (game reaches playerLimit), 
								//Prevent other users from joining the game, then
								//instantiate the deck
								if (foundGame.players.length === foundGame.playerLimit - 1) {
									console.log("Game is now full. Instantiating deck and changing game status.");
									foundGame.status = false;

									//Instantiate the deck
									/*for (suit = 0; suit <= 3 ; suit++) {
										for (rank = 1; rank <= 13; rank++){
											var path = 'card_' + suit + '_' + rank;
											var txt  = rank + ' of ' + suit;
											Card.create({
												suit : suit,
												rank : rank,
												index: 13 * suit + rank,
												img  : path, 
												alt  : txt,
											}).exec(
											function(cardError, card){
												if (cardError || !card) {
													console.log("Card not created for game " + foundGame.id);
												} else {
													foundGame.deck.add(card.id);
													foundGame.save();
												}
											})
										}
									} */
									foundGame.save();


									//Publish update to the Game's display that Game is closed
									GameDisplay.publishUpdate(foundGame.id, {
										name: foundGame.name,
										gameId: foundGame.id,
										status: foundGame.status,
										playerLimit: foundGame.playerLimit
									});

									//Update the corresponding GameDisplay for future users
									GameDisplay.findOne(foundGame.id,
										function(e, foundDisplay) {
											foundDisplay.status = false;
											foundDisplay.save();
										});
								}


								res.send({
									game: foundGame
								});


							});

					} else {
						res.send("Game is full!");
					}
				});
		}
	},

	//Deals the game's hands
	deal: function(req, res) {
		console.log('\nDeal requested');
		if (req.isSocket && req.body.hasOwnProperty('id')) {
			Game.findOne(req.body.id).populate('players').populate('deck').populate('scrap').exec(
				function(error, foundGame) {
					console.log("Found game: " + foundGame.id);

					//Temp copy of game (without populated player-hands and fields) to be sent via publishUpdate
					var gameSend = {};
					//Temp copies of players to be sent via publishUpdate
					var p0 = new PlayerTemp();
					var p1 = new PlayerTemp();

					//TESTING SORTDECK
					console.log('\nSorting deck:');
					var sortedDeck = sortDeck(foundGame.deck);

					//Deal 1 extra card to player 0
					foundGame.players[0].hand.add(sortedDeck[0].id);
					foundGame.deck.remove(sortedDeck[0].id);
					p0.hand.push(sortedDeck.shift());
					for (i = 1; i <= 5; i++) {

						foundGame.players[1].hand.add(sortedDeck[0].id);
						foundGame.deck.remove(sortedDeck[0].id);
						p1.hand.push(sortedDeck.shift());

						foundGame.players[0].hand.add(sortedDeck[0].id);
						foundGame.deck.remove(sortedDeck[0].id);
						p0.hand.push(sortedDeck.shift());
					}
					foundGame.save();
					foundGame.players[0].save();
					foundGame.players[1].save();

					var players = [p0, p1];
					console.log(players);

					Game.publishUpdate(foundGame.id, {
						game: foundGame,
						players: players,
						p0: p0,
						p1: p1,
						p0Hand: p0.hand,
						p1Hand: p1.hand
					});
				});
		}
	},

	updateAll: function(req, res) {
		console.log('Publishing All updates');
		Game.find().populate('players').exec(
			function(err, games) {
				games.forEach(function(game, index, gameList) {
					console.log('publishing updates for game: ' + game.id);
					Game.publishUpdate(game.id, {
						gameId: game.id
					});
				});
			});
	}
};