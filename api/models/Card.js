/**
* Card.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

  	suit: {
  		type: 'integer',
  		required: true
  	},

  	rank: {
  		type: 'integer',
  		required: true
  	},

  	//Index indicating where in a hand/field/deck/scrap the card is
  	index: {
  		type: 'integer'
  	},

  	//Path to card image
  	img: {
  		type: 'string'
  	},

  	//Alt text if image can't be loaded
  	alt: {
  		type: 'string'
  	},

  	//Foreign key to game if this card is in the deck
  	deck: {
  		model: 'game'
  	},

  	//Foreign key to game if this card is in the scrap pile
  	scrap: {
  		model: 'game'
  	},

  	//Foreign key to player if this card is in a player's hand
  	hand: {
  		model: 'player'
  	},

  	//Foreign key to player if this card is in a player's field
  	field: {
  		model: 'player'
  	},

  	//Collection of face cards attached to a given card
  	//TODO: FIND BETTER NAME
  	attachments: {
  		collection: 'card',
  		via: 'attachedTo'
  	},

  	//Foreign key to a card to which this card is attached
  	//(if it's a face card attached to another card)
  	attachedTo: {
  		model: 'card'
  	}
  }
};

