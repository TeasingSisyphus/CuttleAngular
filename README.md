# Cuttle_Angular

a [Sails](http://sailsjs.org) application



PREVIOUS:
	-Enabled drawing a card on your turn
	-Refactored Dealing action to leverage 'sortPlayers', to divorce the player's index in the game.players collection from their playerNumber 
		-This allows an easy switching of p0 and p1 at game's end
	-Enabled shuffling
	-Refactored deal action to use synthetic index for cards
		-Deal action now publishes its update with a deck attribute (sortDeck), used instead of game.deck
		-Now properly updates index of cards upon moving them
		-app will NO LONGER USE LITERAL INDEX OF CARDS WITHIN THEIR RESPECTIVE COLLECTIONS
	-Front end now displays your cards only (displays card back for opponent's cards)
	-Front end now updates GameController when Game event fires through socket
	-Hands can now be dealt
	-The homepage now updates to reflect when a game fills
		-Implemented GameDisplay model to dichotomize subscription to all games for homepage with subscription
			to an individual game to play
		-Game statuses are accurate upon an update and upon first loading a page
	-The original html page now contains both the homepage (game creation form and list of games), and the gameView
		-Homepage is hidden when the gameView is revealed and vice-versa
	-Client can request to be subscribed to a game

NEXT:
	-Enable playing a card to the field
	-Fix playerNum bug


BUGS:
	-PLAYER NUMBER
		-If two players join in rapid (not that rapid) succession, server will consider both players to be player 0
	-HOMEPAGE GAMEDISPLAY
		-The first tab to load the homepage occasionally doesn't get updated when games are created (including its own creations)