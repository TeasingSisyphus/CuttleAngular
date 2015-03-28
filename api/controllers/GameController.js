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

	sorted.sort(function(a, b) {
		return a.index - b.index
	});

	return sorted;
};

var sortPlayers = function(players) {
	var sorted = [];

	for (var i = 0; i < players.length; i++) {
		sorted.push(players[i]);
	}

	sorted.sort(function(a, b) {
		return a.playerNumber - b.playerNumber
	});

	return sorted;
};
//Creates an array of integers starting @ start, ending @ stop and incrimenting by step
var range = function(start, stop, step) {
	var a = [start],
		b = start;
	while (b < stop) {
		b += step;
		a.push(b)
	}
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
					console.log("Found game: " + foundGame.id + " for deal");

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
					playerSort[0].hand.add(sortDeck[0].id); //Add card to player's hand

					sortDeck[0].index = 0; //Change index of card
					sortDeck[0].save();

					foundGame.deck.remove(sortDeck[0].id); //Remove card from foundGame.deck

					p0.hand.push(sortDeck.shift()); //Move card from sortDeck into playerTemp hand


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
						var indices = range(0, sortDeck.length - 1, 1);
						var random = 0;


						for (i = 0; i < sortDeck.length; i++) {
							random = Math.floor((Math.random() * ((indices.length) - 0)) + 0);
							//console.log(i + "th Random index: " + indices[random]);

							sortDeck[i].index = indices.splice(random, 1)[0];
							sortDeck[i].save();
						}

						var shuffled = sortCards(sortDeck);

						Game.publishUpdate(foundGame.id, {
							deck: shuffled
						});
					}
				});
		}
	},


	draw: function(req, res) {
		if (req.isSocket && req.body.hasOwnProperty('id')) {
			console.log('\nDraw requested for game: ' + req.body.id);

			Game.findOne(req.body.id).populate('deck').populate('players').exec(
				function(err, foundGame) {
					if (err || !foundGame) {
						console.log("Game " + req.body.id + " not found for deal");
						res.send(404);
					} else if (foundGame.players.length === foundGame.playerLimit) {

						Player.find([foundGame.players[0].id, foundGame.players[1].id]).populateAll().exec(
							function(e, pop_players) {
								if (e || !pop_players) {
									console.log("Players not found in game: " + foundGame.id + " for draw");
									res.send(404);
								} else {

									var playerSort = sortPlayers(pop_players);

									var pNum = null;

									if (req.socket.id === playerSort[0].socketId) {
										pNum = 0;
									} else if (req.socket.id === playerSort[1].socketId) {
										pNum = 1;
									} else {
										console.log('Requesting socket: ' + req.socket.id + " is not in game: " + foundGame.id);
										res.send(404);
									}

									if ((pNum === 0 || pNum === 1) && (pNum === foundGame.turn % 2) && pop_players[pNum].hand.length < foundGame.handLimit) {

										var deckSort = sortCards(foundGame.deck);

										var handSort1 = sortCards(playerSort[0].hand);
										var fieldSort1 = sortCards(playerSort[0].field);
										var handSort2 = sortCards(playerSort[1].hand);
										var fieldSort2 = sortCards(playerSort[1].field);



										playerSort[pNum].hand.add(deckSort[0].id);
										playerSort[pNum].save();

										foundGame.deck.remove(deckSort[0].id);
										foundGame.turn++;
										foundGame.save();



										var p0 = new PlayerTemp;
										var p1 = new PlayerTemp;


										switch (pNum) {
											case 0:
												handSort1.push(deckSort.shift());
												Card.findOne(handSort1[handSort1.length - 1].id).exec(
													function(cardE, card) {
														console.log(card);
														card.index = handSort1.length - 1;
														card.save();
													});
												handSort1[handSort1.length - 1].index = handSort1.length - 1;
												// console.log(handSort1);
												// console.log(handSort1[handSort1.length - 1])
												// handSort1[handSort1.length - 1].save();
												break;
											case 1:
												handSort2.push(deckSort.shift());
												Card.findOne(handSort2[handSort2.length - 1].id).exec(
													function(cardE, card) {

														console.log(card);
														card.index = handSort2.length - 1;
														card.save();


													});
												handSort2[handSort2.length - 1].index = handSort2.length - 1;
												// console.log(handSort2);
												// console.log(handSort2[handSort2.length - 1]);
												// handSort2[handSort2.length - 1].save();
												break;
										}

										//CONSIDER CHANGING INDICES OF CARDS IN DECK, HERE

										p0.hand = handSort1;
										p0.field = fieldSort1;
										p1.hand = handSort2;
										p1.field = fieldSort2;

										var players = [p0, p1];

										Game.publishUpdate(foundGame.id, {
											deck: deckSort,
											players: players
										});


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

	toField: function(req, res) {

		console.log(req.body);
		if (req.isSocket && req.body.hasOwnProperty('id') && req.body.hasOwnProperty('index')) {
			console.log('\nField requested for game: ' + req.body.id + ' with index: ' + req.body.index);
			Game.findOne(req.body.id).populate('players').exec(
				function(err, foundGame) {
					if (err || !foundGame) {
						console.log("Game " + req.body.id + " not found for field");
						res.send(404);
					} else if (foundGame.players.length === foundGame.playerLimit) {
						Player.find([foundGame.players[0].id, foundGame.players[1].id]).populateAll().exec(
							function(e, pop_players) {
								if (e || !pop_players) {
									console.log("Players not found in game: " + foundGame.id + " for field");
									res.send(404);
								} else {

									var playerSort = sortPlayers(pop_players);
									var pNum = null;

									if (req.socket.id === playerSort[0].socketId) {
										pNum = 0;
									} else if (req.socket.id === playerSort[1].socketId) {

										pNum = 1;

									} else {

										console.log('Requesting socket: ' + req.socket.id + " is not in game: " + foundGame.id);
										res.send(404);

									}
									if ((pNum === 0 || pNum === 1) && (pNum === foundGame.turn % 2) && (playerSort[pNum].hand[req.body.index].rank !== 11)) {
										console.log("\nField move is legal for game " + foundGame.id);

										var p0 = new PlayerTemp;
										var p1 = new PlayerTemp;

										var handSort1 = sortCards(playerSort[0].hand);
										var fieldSort1 = sortCards(playerSort[0].field);

										var handSort2 = sortCards(playerSort[1].hand);
										var fieldSort2 = sortCards(playerSort[1].field);

										foundGame.turn++;
										foundGame.save();

										//Local Data for Client Update
										if (pNum === 0) {
											fieldSort1.push(handSort1.splice(req.body.index, 1)[0]);

											fieldSort1[fieldSort1.length - 1].index = fieldSort1.length - 1;
											//Server Changes
											playerSort[pNum].field.add(fieldSort1[fieldSort1.length - 1].id);
											playerSort[pNum].hand.remove(fieldSort1[fieldSort1.length - 1].id);
											playerSort[pNum].save();

											console.log("Logging card in fieldSort: ");
											console.log(fieldSort1[fieldSort1.length - 1]);

											//Change index of Card just moved to field on server
											Card.findOne(fieldSort1[fieldSort1.length - 1].id).exec(
												function(cardE, card) {
													card.index = fieldSort1.length - 1;
													card.save();
													console.log("\nCard just moved to field:")
													console.log(card);
												});
											// Change the indices of Cards in hand after the moved Card
											var decriment = [];
											handSort1.forEach(function(card, index, hand) {
												if (index >= req.body.index) {
													decriment.push(card.id);
												}
											});
											Card.find(decriment).exec(
												function(teh_error, cards) {
													console.log("\nLogging cards to have indices decrimented");
													console.log(cards);
													cards.forEach(function(card, index, list) {
														card.index--;
														card.save();
													})
												});

										} else if (pNum === 1) {
											fieldSort2.push(handSort2.splice(req.body.index, 1)[0]);

											fieldSort2[fieldSort2.length - 1].index = fieldSort2.length - 1;
											//Server changes
											playerSort[pNum].field.add(fieldSort2[fieldSort2.length - 1].id);
											playerSort[pNum].hand.remove(fieldSort2[fieldSort2.length - 1].id);
											playerSort[pNum].save();
											console.log("Logging card in fieldSort: ");
											console.log(fieldSort2[fieldSort2.length - 1]);
											//Change index of Card just moved to field on server
											Card.findOne(fieldSort2[fieldSort2.length - 1].id).exec(
												function(cardE, card) {
													card.index = fieldSort2.length - 1;
													card.save();
													console.log("\nCard just moved to field");
													console.log(card);
												});
											//Change the indices of Cards in hand after the moved Card
											var decriment = [];
											handSort2.forEach(function(card, index, hand) {
												if (index >= req.body.index) {
													decriment.push(card.id);
												}
											});
											Card.find(decriment).exec(
												function(teh_error, cards) {
													console.log("\nLogging cards to have indices decrimented");
													console.log(cards);
													cards.forEach(function(card, index, list) {
														card.index--;
														card.save();
													})
												});
										}

										p0.hand = handSort1;
										p0.field = fieldSort1;
										p1.hand = handSort2;
										p1.field = fieldSort2;

										var players = [p0, p1];

										Game.publishUpdate(foundGame.id, {
											players: players
										});
										res.send('Card moved to field');


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