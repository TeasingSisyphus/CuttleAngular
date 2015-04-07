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
};

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

var winner = function(game, fields) {
	console.log("\nChecking game " + game.id + " for a winner");
	var p0Points = 0;
	var p0Kings = 0;
	var p1Points = 0;
	var p1Kings = 0;

	var tempRank = 0;

	//Check points and kings for p0
	fields[0].forEach(
		function(card, index, field) {
			if (card.rank === 13) {
				p0Kings++;
			} else if (card.rank <= 10 && !card.isGlasses) {
				p0Points += card.rank;
			}
		});

	fields[1].forEach(
		function(card, index, fiel) {
			if (card.rank === 13) {
				p1Kings++;
			} else if (card.rank <= 10 && !card.isGlasses) {
				p1Points += card.rank;
			}
		});

	console.log("Player0 has " + p0Points + " points and " + p0Kings + " Kings");
	console.log("Player1 has " + p1Points + " points and " + p1Kings + " Kings");
	//Check p0 for a win
	switch (p0Kings) {
		case 0:
			if (p0Points >= 21) {
				console.log("\nPlayer 0 has won with " + p0Points + " points");
				game.log.push("Player 0 has won with " + p0Points + " points");
				game.winner = 0;
			}
			break;
		case 1:
			if (p0Points >= 14) {
				console.log("\nPlayer 0 has won with " + p0Points + " points and 1 King");
				game.log.push("Player 0 has won with " + p0Points + " points and 1 King");
				game.winner = 0;
			}
			break;
		case 2:
			if (p0Points >= 10) {
				console.log("\nPlayer 0 has won with " + p0Points + " points and 2 Kings");
				game.log.push("Player 0 has won with " + p0Points + " points and 2 Kings");
				game.winner = 0;
			}
			break;
		case 3:
			if (p0Points >= 7) {
				console.log("\nPlayer 0 has won with " + p0Points + " points and 3 Kings");
				game.log.push("Player 0 has won with " + p0Points + " points and 3 Kings");
				game.winner = 0;
			}
			break;
		case 4:
			if (p0Points >= 5) {
				console.log("\nPlayer 0 has won with " + p0Points + " points and 4 Kings");
				game.log.push("Player 0 has won with " + p0Points + " points and 4 Kings");
				game.winner = 0;
			}
	}

	//Check p1 for a win
	switch (p1Kings) {
		case 0:
			if (p1Points >= 21) {
				console.log("\nPlayer 1 has won with " + p1Points + " points");
				game.log.push("Player 1 has won with " + p1Points + " points");
				game.winner = 1;
			}
			break;
		case 1:
			if (p1Points >= 14) {
				console.log("\nPlayer 1 has won with " + p1Points + " points and 1 King");
				game.log.push("Player 1 has won with " + p1Points + " points and 1 King");
				game.winner = 1;
			}
			break;
		case 2:
			if (p1Points >= 10) {
				console.log("\nPlayer 1 has won with " + p1Points + " points and 2 Kings");
				game.log.push("Player 1 has won with " + p1Points + " points and 2 Kings");
				game.winner = 1;
			}
			break;
		case 3:
			if (p1Points >= 7) {
				console.log("\nPlayer 1 has won with " + p1Points + " points and 3 Kings");
				game.log.push("Player 1 has won with " + p1Points + " points and 3 Kings");
				game.winner = 1;
			}
			break;
		case 4:
			if (p1Points >= 5) {
				console.log("\nPlayer 1 has won with " + p1Points + " points and 4 Kings");
				game.log.push("Player 1 has won with " + p1Points + " points and 4 Kings");
				game.winner = 1;
			}
	}


};

//Choose a one-off effect to perform
var chooseEffect = function(game, players, deck, scrap, hands, fields, str) {
	console.log("\nChoosing effect for game " + game.id);
	console.log(str);
	switch (str) {
		case "destroyAllPoints":
			var cardId = game.stack[0].id;

			//destroyAllPoints returns an array: [scrap, hands, fields]
			var arr = destroyAllPoints(game, players, scrap, hands, fields);
			var scrap = arr[0];

			break;
	}
	game.scrap.add(cardId);
	game.stack.remove(cardId);
	Card.findOne(cardId).populateAll().exec(
		function(erro, oneOff) {
			oneOff.index = scrap.length;
			oneOff.save();
		});
	game.save(function(err, savedGame) {
		players[0].hand = arr[1][0]
		players[0].field = arr[2][0];
		players[0].save(function (er, saveP0) {
			players[1].hand  = arr[1][1];
			players[1].field = arr[2][1];
			players[1].save(function(e, saveP1) {

				var p0 = new PlayerTemp;
				var p1 = new PlayerTemp;

				p0.hand  = players[0].hand;
				p0.field = players[0].field;
				p1.hand  = players[1].hand;
				p1.field = players[1].field;

				Game.publishUpdate(savedGame.id, {
					players: [p0, p1],
					scrap: scrap
				});
			});
		});
	});


};

/////////////////////
//One-off Functions//
/////////////////////

var destroyAllPoints = function(game, players, scrap, hands, fields) {
	console.log("\nDestroying all points in game " + game.id);
	var scrappedIds = [];
	var scrapLen = scrap.length;

	var max = Math.max(fields[0].length, fields[1].length);
	for (i = 0; i < max; i++) {
		if (fields[0].length > 0) {
			if (fields[0][0].rank <= 10) {
				game.scrap.add(fields[0][0].id);
							players[0].field.remove(fields[0][0].id);
				
							scrappedIds.push(fields[0][0].id);
				
							scrap.push(fields[0].splice(0, 1)[0]);
			}
		}
		if (fields[1].length > 0) {
			if (fields[1][0].rank <= 10) {

				game.scrap.add(fields[1][0].id);
				players[1].field.remove(fields[1][0].id);

				scrappedIds.push(fields[1][0].id);

				scrap.push(fields[1].splice(0, 1)[0]);

			}
		}

	}


	Card.find(scrappedIds).populateAll().exec(
		function(errr, cards) {
			cards.forEach(
				function(card, index, list) {
					card.index = scrapLen + index;
					scrap[scrapLen + index].index = scrapLen + index;
					card.save(function(ee, ss) {
					});
				});
		});

	return [scrap, hands, fields];

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

							switch (rank) {
								case 11:
									var str_rank = 'Jack';
									break;
								case 12:
									var str_rank = 'Queen';
									break;
								case 13:
									var str_rank = 'King';
									break;
								default:
									var str_rank = rank;
									break;
							}
							switch (suit) {
								case 0:
									var str_suit = 'Clubs';
									break;
								case 1:
									var str_suit = 'Diamonds';
									break;
								case 2:
									var str_suit = 'Hearts';
									break;
								case 3:
									var str_suit = 'Spades';
									break;
							}
							var txt = str_rank + ' of ' + str_suit;
							Card.create({
								suit: suit,
								rank: rank,
								img: path,
								alt: txt,
								index: 13 * suit + rank - 1,
								// collectionIndex: 13 * suit + rank - 1
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

							sortDeck[i].index = indices.splice(random, 1)[0];
							sortDeck[i].save();
						}

						var shuffled = sortCards(sortDeck);
						foundGame.save();

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

			Game.findOne(req.body.id).populateAll().exec(
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

									if ((pNum === 0 || pNum === 1)) {
										if (pNum === foundGame.turn % 2) {

											if (pop_players[pNum].hand.length < foundGame.handLimit) {
												var deckSort = sortCards(foundGame.deck);

												var handSort1 = sortCards(playerSort[0].hand);
												var fieldSort1 = sortCards(playerSort[0].field);
												var handSort2 = sortCards(playerSort[1].hand);
												var fieldSort2 = sortCards(playerSort[1].field);


												var log_tail = " drew the " + deckSort[0].alt;

												playerSort[pNum].hand.add(deckSort[0].id);
												playerSort[pNum].save();



												var p0 = new PlayerTemp;
												var p1 = new PlayerTemp;


												switch (pNum) {
													case 0:
														var log = 'Player 0 ' + log_tail;
														foundGame.log.push(log);
														foundGame.deck.remove(deckSort[0].id);
														foundGame.turn++;
														foundGame.save();
														handSort1.push(deckSort.shift());
														Card.findOne(handSort1[handSort1.length - 1].id).exec(
															function(cardE, card) {
																console.log(card);
																card.index = handSort1.length - 1;
																card.save();
															});
														handSort1[handSort1.length - 1].index = handSort1.length - 1;

														break;
													case 1:
														var log = 'Player 1 ' + log_tail;
														foundGame.log.push(log);
														foundGame.deck.remove(deckSort[0].id);
														foundGame.turn++;
														foundGame.save();
														handSort2.push(deckSort.shift());
														Card.findOne(handSort2[handSort2.length - 1].id).exec(
															function(cardE, card) {

																console.log(card);
																card.index = handSort2.length - 1;
																card.save();


															});
														handSort2[handSort2.length - 1].index = handSort2.length - 1;

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
												console.log("This player's hand is full");
												res.send("Your hand is full!");
											}

										} else {
											console.log("It's not this player's turn");
											console.log(foundGame.turn);
											res.send("Not your turn!");
										}


									} else {
										console.log("Can't find playerNumber");
										res.send("WHO ARE YOU?!");
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
			Game.findOne(req.body.id).populateAll().exec(
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
									//CHANGE CONDITIONAL TO USE SORTED HANDS
									if ((pNum === 0 || pNum === 1) && (pNum === foundGame.turn % 2)) {
										console.log("\nField move is legal for game " + foundGame.id);


										var p0 = new PlayerTemp;
										var p1 = new PlayerTemp;

										var handSort1 = sortCards(playerSort[0].hand);
										var handSort2 = sortCards(playerSort[1].hand);
										var fieldSort1 = sortCards(playerSort[0].field);

										var fieldSort2 = sortCards(playerSort[1].field);



										if (pNum === 0) {
											if (handSort1[req.body.index].rank !== 11) {

												var logTail = '';
												if (handSort1[req.body.index].rank <= 10) {
													logTail = ' for points';
												}

												foundGame.turn++;
												var log = 'Player 0 played the ' + handSort1[req.body.index].alt + logTail;
												foundGame.log.push(log);
												foundGame.save();
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
														cards.forEach(function(card, index, list) {
															card.index--;
															card.save();
														});
													});

											} else {
												console.log("Player 0 attempting to play Jack to their field");
												res.send("You must play a jack on a point card already on the field!");
											}

										} else if (pNum === 1) {

											if (handSort2[req.body.index].rank !== 11) {
												var logTail = '';
												if (handSort2[req.body.index].rank <= 10) {
													logTail = ' for points';
												}
												foundGame.turn++;
												var log = 'Player 1 played the ' + handSort2[req.body.index].alt + logTail;
												foundGame.log.push(log);
												foundGame.save();

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
														cards.forEach(function(card, index, list) {
															card.index--;
															card.save();
														});
													});
											} else {
												console.log("Player 1 is attempting to play a Jack to their field");
												res.send("You must play a jack on a point card already on the field!");
											}
										}

										p0.hand = handSort1;
										p0.field = fieldSort1;
										p1.hand = handSort2;
										p1.field = fieldSort2;

										var players = [p0, p1];

										winner(foundGame, [fieldSort1, fieldSort2]);
										foundGame.save();
										console.log(foundGame.winner);


										Game.publishUpdate(foundGame.id, {
											players: players,
											game: foundGame
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

	scuttle: function(req, res) {

		console.log(req.body);
		if (req.isSocket && req.body.hasOwnProperty('id') && req.body.hasOwnProperty('index') && req.body.hasOwnProperty('target')) {
			console.log('\nScuttle requested for game: ' + req.body.id + ' with index: ' + req.body.index + " and target: " + req.body.target);
			Game.findOne(req.body.id).populateAll().exec(
				function(err, foundGame) {
					if (err || !foundGame) {
						console.log("Game " + req.body.id + " not found for scuttle");
						res.send(404);
					} else if (foundGame.players.length === foundGame.playerLimit) {
						Player.find([foundGame.players[0].id, foundGame.players[1].id]).populateAll().exec(
							function(e, pop_players) {
								if (e || !pop_players) {
									console.log("Players not found in game: " + foundGame.id + " for scuttle");
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
									if ((pNum === 0 || pNum === 1) && (pNum === foundGame.turn % 2)) {


										var p0 = new PlayerTemp;
										var p1 = new PlayerTemp;

										var deckSort = sortCards(foundGame.deck);
										var scrapSort = sortCards(foundGame.scrap);

										var handSort1 = sortCards(playerSort[0].hand);
										var fieldSort1 = sortCards(playerSort[0].field);

										var handSort2 = sortCards(playerSort[1].hand);
										var fieldSort2 = sortCards(playerSort[1].field);


										if (pNum === 0) {
											//Check legality of scuttle
											if ((handSort1[req.body.index].rank <= 10) && (fieldSort2[req.body.target].rank <= 10) && (!fieldSort2[req.body.target].isGlasses) && ((handSort1[req.body.index].rank > fieldSort2[req.body.target].rank) || ((handSort1[req.body.index].rank === fieldSort2[req.body.target].rank) && (handSort1[req.body.index].suit > fieldSort2[req.body.target].suit)))) {
												console.log("Scuttle is legal");
												var log = "Player 0 scuttled Player 1's " + fieldSort2[req.body.target].alt + " with their " + handSort1[req.body.index].alt;

												scrapSort.push(fieldSort2.splice(req.body.target, 1)[0]);
												scrapSort[scrapSort.length - 1].index = scrapSort.length - 1;

												scrapSort.push(handSort1.splice(req.body.index, 1)[0]);
												scrapSort[scrapSort.length - 1].index = scrapSort.length - 1;

												//Server Changes
												foundGame.scrap.add(scrapSort[scrapSort.length - 2].id); //Move oppoent's Card
												playerSort[1].field.remove(scrapSort[scrapSort.length - 2].id);
												foundGame.scrap.add(scrapSort[scrapSort.length - 1].id); //Move your Card         
												playerSort[0].hand.remove(scrapSort[scrapSort.length - 1].id);
												playerSort[0].save(
													function(error, s) {
														playerSort[1].save(
															function(e_rorr, saveIt) {
																foundGame.turn++;
																foundGame.log.push(log);
																foundGame.save(
																	function(e_ror_r, save_it) {
																		console.log("Logging scrapSort: ");
																		console.log(scrapSort);

																		// Change index of Card just moved to scrap on server
																		Card.find([scrapSort[scrapSort.length - 1].id, scrapSort[scrapSort.length - 2].id]).exec(
																			function(cardE, cards) {
																				cards[0].index = scrapSort.length - 1;
																				cards[0].save();
																				cards[1].index = scrapSort.length - 2;
																				cards[1].save();
																				// console.log("\nCards just moved to scrap:")
																				// console.log(cards);
																			});
																		// Change the indices of Cards in hand after the moved Card
																		var decriment = [];
																		handSort1.forEach(function(card, index, hand) {
																			if (index >= req.body.index) {
																				decriment.push(card.id);
																			}
																		});
																		fieldSort2.forEach(function(card, index, field) {
																			if (index >= req.body.target) {
																				decriment.push(card.id);
																			}
																		});
																		Card.find(decriment).exec(
																			function(teh_error, cards) {
																				cards.forEach(function(card, index, list) {
																					card.index--;
																					card.save();
																				});
																				// console.log("\nLogging cards with indices decrimented");
																				// console.log(cards);
																			});

																	});
															});
													});

											}
											//Local Data for Client Update


										} else if (pNum === 1) {
											//Check legality of scuttle
											if ((handSort2[req.body.index].rank <= 10) && (fieldSort1[req.body.target].rank <= 10) && ((handSort2[req.body.index].rank > fieldSort1[req.body.target].rank) || ((handSort2[req.body.index].rank === fieldSort1[req.body.target].rank) && (handSort2[req.body.index].suit > fieldSort1[req.body.target].suit)))) {
												console.log("Scuttle is legal");
												var log = "Player 1 scuttled Player 0's " + fieldSort1[req.body.target].alt + " with their " + handSort2[req.body.index].alt;

												// Local changes for client
												scrapSort.push(fieldSort1.splice(req.body.target, 1)[0]);
												scrapSort[scrapSort.length - 1].index = scrapSort.length - 1;

												scrapSort.push(handSort2.splice(req.body.index, 1)[0]);
												scrapSort[scrapSort.length - 1].index = scrapSort.length - 1;

												// Server Changes
												foundGame.scrap.add(scrapSort[scrapSort.length - 2].id); //Move oppoent's Card
												playerSort[0].field.remove(scrapSort[scrapSort.length - 2].id);
												foundGame.scrap.add(scrapSort[scrapSort.length - 1].id); //Move your Card         
												playerSort[1].hand.remove(scrapSort[scrapSort.length - 1].id);
												playerSort[1].save(
													function(error, s) {
														playerSort[0].save(
															function(e_rorr, saveIt) {
																foundGame.turn++;
																foundGame.log.push(log);
																foundGame.save(
																	function(e_ror_r, save_it) {
																		console.log("Logging scrapSort: ");
																		console.log(scrapSort);

																		// Change index of Card just moved to scrap on server
																		Card.find([scrapSort[scrapSort.length - 1].id, scrapSort[scrapSort.length - 2].id]).exec(
																			function(cardE, cards) {
																				cards[0].index = scrapSort.length - 1;
																				cards[0].save(
																					function(err_or, saving) {
																						cards[1].index = scrapSort.length - 2;
																						// console.log("\nCards just moved to scrap:");
																						// console.log(cards);
																						cards[1].save();
																					});
																			});
																		// Change the indices of Cards in hand after the moved Card
																		var decriment = [];
																		handSort2.forEach(function(card, index, hand) {
																			if (index >= req.body.index) {
																				decriment.push(card.id);
																			}
																		});
																		fieldSort1.forEach(function(card, index, field) {
																			if (index >= req.body.target) {
																				decriment.push(card.id);
																			}
																		});
																		Card.find(decriment).exec(
																			function(teh_error, cards) {
																				cards.forEach(function(card, index, list) {
																					card.index--;
																					card.save();
																				});
																				// console.log("\nLogging cards with indices decrimented");
																				// console.log(cards);
																			});

																	});
															});
													});
											}
										}

										p0.hand = handSort1;
										p0.field = fieldSort1;
										p1.hand = handSort2;
										p1.field = fieldSort2;

										var players = [p0, p1];

										Game.publishUpdate(foundGame.id, {
											players: players,
											deck: deckSort,
											scrap: scrapSort
										});
										res.send('Card scuttled');


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

	glasses: function(req, res) {
		if (req.isSocket && req.body.hasOwnProperty('id') && req.body.hasOwnProperty('index')) {
			console.log("\nGlasses play requested for game " + req.body.index);
			Game.findOne(req.body.id).populateAll().exec(
				function(err, foundGame) {
					if (err || !foundGame) {
						console.log("Game " + req.body.id + " not found for glasses");
						res.send({
							success: false
						});
					} else if (foundGame.players.length === foundGame.playerLimit) {
						Player.find([foundGame.players[0].id, foundGame.players[1].id]).populateAll().exec(
							function(e, pop_players) {
								if (e || !pop_players) {
									console.log("Players not found for glasses");
									res.send({
										success: false
									});
								} else {
									var playerSort = sortPlayers(pop_players);
									var pNum = null;


									if (req.socket.id === playerSort[0].socketId) {
										pNum = 0;
									} else if (req.socket.id === playerSort[1].socketId) {

										pNum = 1;

									} else {

										console.log('Requesting socket: ' + req.socket.id + " is not in game: " + foundGame.id);
										res.send({
											success: false
										});
									}
									if ((pNum === 0 || pNum === 1) && (pNum === foundGame.turn % 2)) {
										console.log("\nGlasses play is legal for game " + foundGame.id + " and player " + pNum);


										var p0 = new PlayerTemp;
										var p1 = new PlayerTemp;

										var handSort1 = sortCards(playerSort[0].hand);
										var handSort2 = sortCards(playerSort[1].hand);

										var fieldSort1 = sortCards(playerSort[0].field);
										var fieldSort2 = sortCards(playerSort[1].field);

										if (pNum === 0) {
											var log = "Player 0 played the " + handSort1[req.body.index].alt + " as glasses";
											foundGame.log.push(log);
											foundGame.turn++;
											foundGame.save();

											playerSort[0].hand.remove(handSort1[req.body.index].id);
											playerSort[0].field.add(handSort1[req.body.index].id);

											playerSort[0].save();
											// function(er, s) {

											var path = '';
											//Local changes for clients
											fieldSort1.push(handSort1.splice(req.body.index, 1)[0]);
											fieldSort1[fieldSort1.length - 1].index = fieldSort1.length - 1;

											//Change index of Card just moved to field on server
											Card.findOne(fieldSort1[fieldSort1.length - 1].id).exec(
												function(cardE, card) {
													card.index = fieldSort1.length - 1;
													card.isGlasses = true;

													switch (card.suit) {
														case 0:
															path = "images/cards/Glasses_Clubs.jpg"
															break;
														case 1:
															path = "images/cards/Glasses_Diamonds.jpg"
															break;
														case 2:
															path = "images/cards/Glasses_Hearts.jpg"
															break;
														case 3:
															path = "images/cards/Glasses_Spades.jpg"
															break;

													}
													card.img = path;
													card.save();
													console.log("\nCard just moved to field");
													console.log(card);

													fieldSort1[fieldSort1.length - 1].img = path;
													fieldSort1[fieldSort1.length - 1].isGlasses = true;

													//Change the indices of Cards in hand after the moved Card
													var decriment = [];
													handSort1.forEach(function(card, index, hand) {
														if (index >= req.body.index) {
															decriment.push(card.id);
														}
													});
													Card.find(decriment).exec(
														function(teh_error, cards) {
															cards.forEach(function(card, index, list) {
																card.index--;
																card.save();
															});

															p0.hand = handSort1;
															p0.field = fieldSort1;
															p1.hand = handSort2;
															p1.field = fieldSort2;

															var players = [p0, p1];

															console.log(players);
															res.send({
																success: true
															});
															Game.publishUpdate(foundGame.id, {
																players: players,
																// deck: deckSort,
															});
														});
												});

											// });



										} else if (pNum === 1) {
											var log = "Player 1 played the " + handSort2[req.body.index].alt + " as glasses";
											foundGame.log.push(log);
											foundGame.turn++;
											foundGame.save();

											playerSort[1].hand.remove(handSort2[req.body.index].id);
											playerSort[1].field.add(handSort2[req.body.index].id);

											playerSort[1].save();
											// function(er, s) {

											var path = '';
											//Local changes for clients
											fieldSort2.push(handSort2.splice(req.body.index, 1)[0]);
											fieldSort2[fieldSort2.length - 1].index = fieldSort2.length - 1;

											//Change index of Card just moved to field on server
											Card.findOne(fieldSort2[fieldSort2.length - 1].id).exec(
												function(cardE, card) {
													card.index = fieldSort1.length - 1;
													card.isGlasses = true;

													switch (card.suit) {
														case 0:
															path = "images/cards/Glasses_Clubs.jpg"
															break;
														case 1:
															path = "images/cards/Glasses_Diamonds.jpg"
															break;
														case 2:
															path = "images/cards/Glasses_Hearts.jpg"
															break;
														case 3:
															path = "images/cards/Glasses_Spades.jpg"
															break;

													}
													card.img = path;
													card.save();
													console.log("\nCard just moved to field");
													console.log(card);

													fieldSort2[fieldSort2.length - 1].img = path;
													fieldSort2[fieldSort2.length - 1].isGlasses = true;

													//Change the indices of Cards in hand after the moved Card
													var decriment = [];
													handSort2.forEach(function(card, index, hand) {
														if (index >= req.body.index) {
															decriment.push(card.id);
														}
													});
													Card.find(decriment).exec(
														function(teh_error, cards) {
															cards.forEach(function(card, index, list) {
																card.index--;
																card.save();
															});

															p0.hand = handSort1;
															p0.field = fieldSort1;
															p1.hand = handSort2;
															p1.field = fieldSort2;

															var players = [p0, p1];

															console.log(players);
															res.send({
																success: true
															});
															Game.publishUpdate(foundGame.id, {
																players: players,
																// deck: deckSort,
															});
														});
												});

											// });



										}

									} else {
										console.log("Wrong player's turn in game " + foundGame.id + " for glasses play");
										res.send({
											success: false
										});
									}
								}
							});
					} else {
						console.log("Not enough players in game " + foundGame.id + " for glasses play");
						res.send({
							success: false
						});
					}
				});
		}
	},

	//Moves a card from a player's hand to the game's stack
	pushStack: function(req, res) {
		if (req.isSocket && req.body.hasOwnProperty('id') && req.body.hasOwnProperty('id')) {
			console.log("\nGame " + req.body.id + " requesting to push one-off to stack");
			Game.findOne(req.body.id).populateAll().exec(function(err, foundGame) {
				if (err || !foundGame) {
					console.log("Game " + req.body.id + " not found for pushStack");
					res.send(404);
				} else if (foundGame.players.length === foundGame.playerLimit) {
					Player.find([foundGame.players[0].id, foundGame.players[1].id]).populateAll().exec(
						function(e, pop_players) {
							if (e || !pop_players) {
								console.log("Players not found in game: " + foundGame.id + " for scuttle");
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
								var p0 = new PlayerTemp;
								var p1 = new PlayerTemp;

								var deckSort = sortCards(foundGame.deck);
								var scrapSort = sortCards(foundGame.scrap);
								var stackSort = sortCards(foundGame.stack);

								var handSort1 = sortCards(playerSort[0].hand);
								var fieldSort1 = sortCards(playerSort[0].field);

								var handSort2 = sortCards(playerSort[1].hand);
								var fieldSort2 = sortCards(playerSort[1].field);
								if ((pNum === 0 || pNum === 1)) {
									if (pNum === 0) {
										if ((foundGame.turn % 2 === 0) || (stackSort.length > 0 && handSort1[req.body.index].rank === 2)) {

											if (req.body.hasOwnProperty('target')) {
												//set card's target, push it to stack, remove from hand
											} else {
												console.log("Player 0 requested pushStack");

												foundGame.stack.add(handSort1[req.body.index].id);
												var log = "Player " + pNum + " has played the " + playerSort[pNum].hand[req.body.index].alt + " for its one-off effect";
												foundGame.log.push(log);
												foundGame.save(
													function(err_or, savedGame) {

														playerSort[0].hand.remove(handSort1[req.body.index].id);
														playerSort[0].save(
															function(er_ror, savedPlayer) {
																stackSort.push(handSort1.splice(req.body.index, 1)[0]);
																stackSort[stackSort.length - 1].index = stackSort.length - 1;
																console.log("\nLogging stackSort");
																console.log(stackSort);

																// Change index of Card just moved to stack
																Card.findOne(stackSort[stackSort.length - 1].id).exec(
																	function(cardE, card) {
																		card.index = stackSort.length - 1;
																		card.save();

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
																		cards.forEach(function(card, index, list) {
																			card.index--;
																			card.save();
																		});
																		// console.log("\nLogging cards with indices decrimented");
																		// console.log(cards);
																	});

																p0.hand = handSort1;
																p0.field = fieldSort1;
																p1.hand = handSort2;
																p1.field = fieldSort2;

																var players = [p0, p1];

																Game.publishUpdate(foundGame.id, {
																	stack: stackSort,
																	players: players
																});

																//Message will be sent to only the other player
																Game.message(foundGame, {
																	stack: stackSort,
																	players: players
																}, req);

																res.send(200);

															});
													});



											}
										}


									}
									if (pNum === 1) {
										if ((foundGame.turn % 2 === 1) || (stackSort.length > 0 && handSort2[req.body.index].rank === 2)) {

											if (req.body.hasOwnProperty('target')) {
												//set card's target, push it to stack, remove from hand
											} else {

												foundGame.stack.add(handSort2[req.body.index].id);
												foundGame.save(
													function(err_or, savedGame) {

														playerSort[1].hand.remove(handSort2[req.body.index].id);
														playerSort[1].save(
															function(er_ror, savedPlayer) {
																stackSort.push(handSort2.splice(req.body.index, 1)[0]);
																stackSort[stackSort.length - 1].index = stackSort.length - 1;
																console.log("\nLogging stackSort");
																console.log(stackSort);

																// Change index of Card just moved to stack
																Card.findOne(stackSort[stackSort.length - 1].id).exec(
																	function(cardE, card) {
																		card.index = stackSort.length - 1;
																		card.save();
																	});
																// Change the indices of Cards in hand after the moved Card
																var decriment = [];
																handSort2.forEach(function(card, index, hand) {
																	if (index >= req.body.index) {
																		decriment.push(card.id);
																	}
																});

																Card.find(decriment).exec(
																	function(teh_error, cards) {
																		cards.forEach(function(card, index, list) {
																			card.index--;
																			card.save();
																		});
																		// console.log("\nLogging cards with indices decrimented");
																		// console.log(cards);
																	});

																p0.hand = handSort1;
																p0.field = fieldSort1;
																p1.hand = handSort2;
																p1.field = fieldSort2;

																var players = [p0, p1];

																Game.publishUpdate(foundGame.id, {
																	stack: stackSort,
																	players: players
																});

																//Message will be sent to only the other player
																Game.message(foundGame, {
																	stack: stackSort,
																	players: players
																}, req);
																res.send(200);

															});
													});



											}
										}
									}
								} else {
									console.log("Wrong player's turn in Game " + foundGame.id + " for pushStack");
								}
							}
						});
				}
			});
		}
	},

	collapseStack: function(req, res) {
		if (req.isSocket && req.body.hasOwnProperty('id')) {
			console.log("\ncollapseStack requested for game " + req.body.id);

			Game.findOne(req.body.id).populateAll().exec(
				function(err, foundGame) {
					if (err || !foundGame) {
						console.log("Game " + req.body.id + " not found for collapseStack");
						res.send(404);
					} else if (foundGame.players.length === foundGame.playerLimit) {
						Player.find([foundGame.players[0].id, foundGame.players[1].id]).populateAll().exec(
							function(e, pop_players) {
								if (e || !pop_players) {
									console.log("Players not found for game " + req.body.id + " for collapseStack");
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


									var deckSort = sortCards(foundGame.deck);
									var scrapSort = sortCards(foundGame.scrap);
									var stackSort = sortCards(foundGame.stack);

									var handSort1 = sortCards(playerSort[0].hand);
									var fieldSort1 = sortCards(playerSort[0].field);

									var handSort2 = sortCards(playerSort[1].hand);
									var fieldSort2 = sortCards(playerSort[1].field);

									var scrappedIds = [];

									var scrapLen = scrapSort.length;
									var stackLen = stackSort.length;

									//If the number of one-offs is even, everything is countered and nothing changes
									//All cards are moved to the scrap and the turn is incrimented
									if ((stackSort.length % 2) === 0) {
										stackSort.forEach(
											function(card, index, stack) {
												foundGame.scrap.add(card.id);
												foundGame.stack.remove(card.id);

												scrappedIds.push(card.id);

											});
										scrapSort = scrapSort.concat(stackSort.splice(0, stackSort.length));
										for (var i = scrapLen; i < scrapLen + stackLen; i++) {
											scrapSort[i].index = i;
										}

										Card.find(scrappedIds).populateAll().exec(
											function(cardE, cards) {
												cards.forEach(
													function(card, index, list) {
														card.index = scrapLen + index;
														card.save();
													});
											});

										foundGame.turn++;
										foundGame.save();

										Game.publishUpdate(foundGame.id, {
											scrap: scrapSort,
											stack: stackSort
										});
										//Otherwise the first card in the stack DOES get resolved
									} else {
										for (i = stackSort.length - 1; i > 0; i--) {
											foundGame.scrap.add(stackSort[i].id);
											foundGame.stack.remove(stackSort[i].id);
											scrappedIds.push(stackSort[i].id);
										}

										scrapSort = scrapSort.concat(stackSort.splice(1, stackSort.length - 1));

										Card.find(scrappedIds).populateAll().exec(
											function(cardE, cards) {
												cards.forEach(
													function(card, index, list) {
														card.index = scrapLen + index;
														card.save();
													});
											});
										console.log("\nLogging scrap then stack.");
										console.log(scrapSort);
										console.log(stackSort);

										foundGame.turn++;
										foundGame.save(
											function(err, savedGame) {

												switch (stackSort[0].rank) {
													case 1:
														var str = foundGame.rules.ace;
														break;
												}
												chooseEffect(savedGame, playerSort, deckSort, scrapSort, [handSort1, handSort2], [fieldSort1, fieldSort2], str);
											});
									}
								}
							});
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