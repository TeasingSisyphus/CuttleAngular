/**
 * GameController
 *
 * @description :: Server-side logic for managing Games
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	subscribe: function(req, res) {
		if (req.isSocket) {
		console.log('subscribing socket: ' + req.socket.id + 
		'to Game class room');
		Game.watch(req);
		}
	},

	create   : function(req, res) {
		console.log('creating Game\n');
		console.log(req.body);
		Game.create({
			name: req.body.name
		}).exec(function(err, newGame) {
			console.log('Created game: ' + newGame.name + 
			', with ID: ' + newGame.id);

			Game.publishCreate({
				name   : newGame.name,
				id     : newGame.id,
				status : newGame.status
			});
		});
	}
};

