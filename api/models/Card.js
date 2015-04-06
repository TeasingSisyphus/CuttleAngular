/**
 * Card.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
    rank: {
      type: 'integer',
      required: true
    },

    suit: {
      type: 'integer',
      required: true
    },


    //Synthetic Index indicating where in a hand/field/deck/scrap the card SHOULD BE
    index: {
      type: 'integer'
    },

    //Literal Index indicating where in the collection the card IS
    collectionIndex: {
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

    //Foreign key to game if this card is on the stack
    stack: {
      model: 'game'
    },

    //Index of target if this card is a targeting one-off
    target: {
      type: 'integer'
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
    },

    //Boolean notes wheter this card is being played as glasses (only possible for eights)
    isGlasses: {
      type: 'boolean',
      defaultsTo: false
    }
  }
};