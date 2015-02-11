(function(){
	var app = angular.module('homepage', []);
	var socket = io.connect('http://localhost:1337');

////////////////
//Socket Stuff//
////////////////

	socket.on('connect', function() {
		socket.get('/game/subscribe', function(res) {
			console.log(res);
		});

		socket.on('Game', function(obj) {
			switch (obj.verb) {
				case 'created':
					console.log(obj.data);
					break;
			}
		});

	});

	app.controller('homepageController', function() {
		this.games = [];
		this.balls = 'BALLS';
		this.name  = '';

		this.createGame = function() {
			console.log('\nForging ahead');
			var name = this.name;
			socket.post('/game/create', {
				name: this.name
			}, function(res) {
				console.log(res);
			});
		};

		/*  $('#gameForm').on('submit', function (){
			console.log('submit');
			console.log(this.name);
		});  */

		this.games.push(gameOne);
		this.games.push(gameTwo);
	});
})();

		var Game = function() {
			this.status = true;
			this.name = '';
		};

		var gameOne = new Game();
		var gameTwo = new Game();

		gameOne.name = 'DatGame';
		gameTwo.name = 'Aww yiss';
