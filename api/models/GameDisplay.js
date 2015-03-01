/**
* GameDisplay.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	//Id and primary key of both GameDisplay
  	//and its corresponding game
  	gameId: {
  		type: 'integer',
  		required: true,
  		primaryKey: true,
  		unique: true
  	},

  	//Name of associated game
  	name: {
  		type: 'string',
  		required: true
  	},

  	//Boolean indicating whether new players may join game
  	status: {
  		type: 'boolean',
  		defaultsTo: true
  	},

  	playerLimit: {
  		type: 'integer',
  		required: true
  	}


  }
};

