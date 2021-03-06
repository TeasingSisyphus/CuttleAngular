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
      defaultsTo: 1
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

    //Collection of all one-off effects waiting to be resolved
    stack: {
      collection: 'card',
      via: 'stack'
    },

    //Log of all moves made, stored as strings
    log: {
      type: 'array',
      defaultsTo: []
    },
    //A json object representing which effect each card will have
    //NOTE: You can actually store FUNCTIONS, rather than strings here
    rules: {
      type: 'json',
      defaultsTo: {
        ace: 'destroyAllPoints',
        two: 'destroyTargetFace',
        five: 'drawTwo',
        six: 'destroyAllFaces'
      }
    }

  }
};