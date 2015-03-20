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

//Sort a collection of cards according to the index attributes of its cards
//Makes no change to original list, but returns a sorted array
var sortCards = function(cards) {
	var sorted = [];

	for (var i = 0; i < cards.length; i++) {
	 sorted.push(cards[i]);
	}

	sorted.sort( function(a,b){return a.index - b.index} );

	return sorted;
};

var sortPlayers = function(players) {
	var sorted = [];

	for (var i = 0; i < players.length; i++) {
		sorted.push(players[i]);
	}

	sorted.sort( function(a,b){return a.playerNumber - b.playerNumber} );

	return sorted;
};
//Creates an array of integers starting @ start, ending @ stop and incrimenting by step
var range = function(start, stop, step){
  var a=[start], b=start;
  while(b<stop){b+=step;a.push(b)}
  return a;
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
								img: path,
								alt: txt,
								index: 13 * suit + rank - 1,
								collectionIndex: 13 * suit + rank - 1
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
									console.log("Game is now full. Changing game status.");
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

					//Sort deck
					var sortDeck = sortCards(foundGame.deck);
					//Sort Players
					var playerSort = sortPlayers(foundGame.players);


					//Deal 1 extra card to player 0
					playerSort[0].hand.add(sortDeck[0].id); 		//Add card to player's hand
					
					sortDeck[0].index = 0; 							//Change index of card
					sortDeck[0].save();
					
					foundGame.deck.remove(sortDeck[0].id);			//Remove card from foundGame.deck
					
					p0.hand.push(sortDeck.shift());					//Move card from sortDeck into playerTemp hand


					for (i = 1; i <= 5; i++) {

						playerSort[1].hand.add(sortDeck[0].id);
						foundGame.deck.remove(sortDeck[0].id);
						sortDeck[0].index = p1.hand.length;
						p1.hand.push(sortDeck.shift());

						playerSort[0].hand.add(sortDeck[0].id);
						foundGame.deck.remove(sortDeck[0].id);
						sortDeck[0].index = p0.hand.length;
						p0.hand.push(sortDeck.shift());
					}
					//Save changes to database
					foundGame.save();
					playerSort[0].save();
					playerSort[1].save();

					var players = [p0, p1];

					Game.publishUpdate(foundGame.id, {
						players: players,
						deck: sortDeck
					});
				});
		}
	},

	shuffle: function(req, res) {
		if (req.isSocket && req.body.hasOwnProperty('id')) {
			console.log("\nShuffle requested for game: " + req.body.id);

			Game.findOne(req.body.id).populate('deck').populate('scrap').populate('players').exec(
			function(err, foundGame) {
				if (err || !foundGame) {
					console.log("Game " + req.body.id + " not found for shuffle");
					res.send(404);
				} else {


					var sortDeck = sortCards(foundGame.deck);
					var indices  = range(0, sortDeck.length - 1, 1);
					var random = 0;

					console.log(sortDeck);

					for (i = 0; i < sortDeck.length; i++) {
						random = Math.floor((Math.random() * ((indices.length) - 0)) + 0);
						console.log(i + "th Random index: " + indices[random]);

						sortDeck[i].index = indices.splice(random, 1)[0];
						sortDeck[i].save();
					}

					var shuffled = sortCards(sortDeck);

					Game.publishUpdate(foundGame.id, {deck : shuffled});
				}
			});
		}
	},


	draw: function(req, res) {
		if (req.isSocket && req.body.hasOwnProperty('id') ) {
			console.log('\nDraw requested for game: ' + req.body.id);

			Game.findOne(req.body.id).populate('deck').populate('players').exec(
			function(err, foundGame) {
				if (err || !foundGame) {
					console.log("Game " + req.body.id + " not found for deal");
					res.send(404);
				} else if (foundGame.players.length === foundGame.playerLimit) {
					console.log("Player id's: " + foundGame.players[0].id + " and " + foundGame.players[1].id);
					Player.find([foundGame.players[0].id, foundGame.players[1].id]).populateAll().exec(
						function(e, pop_players) {
							if(e || ! pop_players) {
								console.log("Players not found in game: " + foundGame.id + " for draw");
								res.send(404);
							} else {
								
								console.log('Found players:');
								console.log(pop_players);

								var playerSort = sortPlayers(pop_players);
								console.log('\nSorted Players: ');
								console.log(playerSort);

								var pNum = null;

								if (req.socket.id === playerSort[0].socketId) {
									pNum = 0;
								} else if (req.socket.id === playerSort[1].socketId) {
									pNum = 1;
								} else {
									console.log('Requesting socket: ' + req.socket.id + " is not in game: " + foundGame.id);
									res.send(404);
								}

								if ( (pNum === 0 || pNum === 1) && (pNum === foundGame.turn % 2 )  && pop_players[pNum].hand.length < foundGame.handLimit) {

									var deckSort = sortCards(foundGame.deck);

									var handSort = sortCards(playerSort[pNum].hand);
									handSort.push( deckSort.shift() );
									foundGame.deck.remove(handSort[handSort.length - 1].id);
									foundGame.turn++;
									foundGame.save();
									handSort[handSort.length - 1].index = handSort.length - 1;
									handSort[handSort.length -1].save();
									playerSort[pNum].hand.add(handSort[handSort.length -1].id);
									playerSort[pNum].save();

									var p0 = new PlayerTemp;
									var p1 = new PlayerTemp;

									// p0.hand  = handSort;
									p0.field = playerSort[0].field;
									// p1.hand  = playerSort[1].hand;
									p1.field = playerSort[1].field;

									switch (pNum) {
										case 0:
											p0.hand = handSort;
											p1.hand = playerSort[1].hand;
											break;
										case 1:
											p1.hand = handSort;
											p0.hand = playerSort[0].hand;
											break;
									}

									var players = [p0, p1];

									Game.publishUpdate(foundGame.id, {deck: deckSort, players: players});


								} else {
									console.log("Not a legal move");
									res.send("Not a legal move!");
								}
							}
						});

				} else {
					console.log("Not enough players!");
					res.send("Not enough players!");
				}
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