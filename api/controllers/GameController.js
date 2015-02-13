/**
 * GameController
 *
 * @description :: Server-side logic for managing Games
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	//This action subscribes a socket to the Game class room, then
	//responds with an array of partial Game objects
	subscribe: function(req, res) {
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
	create   : function(req, res) {
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
	}
};

