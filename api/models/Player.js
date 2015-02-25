/**
* Player.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	//Game player is currently playing
  	currentGame: {
  		model: 'game',
  	},

  	playerNumber: {
  		type: 'integer',
  		required: true
  	},

  	//Collection of cards in player's hand
  	hand: {
  		collection: 'card',
  		via: 'hand'
  	},

  	field: {
  		collection: 'card',
  		via: 'field'
  	},

  	socketId: {
  		type: 'string',
  		defaultsTo: ''
  	}
  }
};

