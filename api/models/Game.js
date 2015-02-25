/**
 * Game.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {

    //Name of Game
    name: {
      type: 'string',
      required: true
    },

    //Id of next game the players joined after this game
    nextId: {
      type: 'string',
    },

    //Boolean representing whether players may join the game
    status: {
      type: 'boolean',
      defaultsTo: true
    },

    handLimit: {
      type: 'integer',
      defaultsTo: 8
    },

    playerLimit: {
      type: 'integer',
      defaultsTo: 2
    },

    turn: {
      type: 'integer',
      defaultsTo: 0
    },

    //Integer representing how many players wish to play again
    play_again: {
      type: 'integer',
      defaultsTo: 0
    },

    players: {
      collection: 'player',
      via: 'currentGame'
    },

    deck: {
      collection: 'card',
      via: 'deck',
    },

    scrap: {
      collection: 'card',
      via: 'scrap'
    },

  }
};