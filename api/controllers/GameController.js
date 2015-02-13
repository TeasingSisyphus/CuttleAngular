/**
 * GameController
 *
 * @description :: Server-side logic for managing Games
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	//This action subscribes a socket to the Game class room, then
	//responds with an array of partial Game objects
	subscribe     : function(req, res) {
		if (req.isSocket) {
		console.log('subscribing socket: ' + req.socket.id + 
		'to Game class room');
		Game.watch(req);
		Game.find().exec(function(err, games){
			var gameList = [];
			games.forEach(
			function(game, index, games) {
				gameList.push({
					name   : game.name,
					id     : game.id,
					status : game.status					
				});
			});

			res.send(gameList);
			
		});
		}
	},

	//Creates a new game and publishes creation to all sockets subscribed
	//to the Game class room
	create        : function(req, res) {
		console.log('creating Game\n');
		console.log(req.body);
		Game.create({
			name: req.body.name
		}).exec(function(err, newGame) {
			console.log('\nCreated game: ' + newGame.name + 
			', with ID: ' + newGame.id);

			console.log(newGame);

			Game.publishCreate({
				name   : newGame.name,
				id     : newGame.id,
				status : newGame.status
			});
		});
	},

	//Subscribes a socket to a Game instance using provided
	//id of requested game
	gameSubscribe : function(req, res) {
		console.log('\ngameSubscribe called');
		//If request came through socket and has an 'id' param,
		//Query for the Game
		if ( req.isSocket && req.body.hasOwnProperty('id') ) {
			Game.findOne(req.body.id).populate('players').exec(
			function (err, foundGame) {

				if (err || !foundGame) {
					console.log("Game not found");
					res.send(404);
				} else{

					//console.log("\nlogging game");
					//console.log(foundGame);

					//Check if this player is first to join game
					var isP1 = (foundGame.players.length === 0);
					//Create new player
					Player.create({
						isPlayerOne: isP1,
						socketId   : req.socket.id,
						currentGame: foundGame 
					}).exec(
					function(err, newPlayer) {
						console.log("\ncreated new player :");
						console.log(newPlayer);

						console.log('\nsubscribing socket ' + req.socket.id + ' to game: ' + foundGame.id);

						//Subscribe the requesting socket to the requested Game
						//The socket will now be notified whenever publishUpdate() or publishDestroy() are used
						//to announce changes to the model
						Game.subscribe(req.socket, foundGame);

						//TODO: remove this when homepage.joinGame makes two requests and 
						//recieves the gameView
						Game.publishUpdate(foundGame.id, {
							game: foundGame
						});

						res.send({game: foundGame});
					

					});

				}
			});
		}
	},

	updateAll       : function(req, res) {
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

