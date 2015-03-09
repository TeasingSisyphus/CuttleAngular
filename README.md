# Cuttle_Angular

a [Sails](http://sailsjs.org) application



PREVIOUS:
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
	-Fix playerNum bug
	-Clean up Socket organization in app.js in GameController
	-Enable shuffling
		-DECIDE BETWEEN USING COLLECTION INDEX VS SYNTHETIC INDEX
			-Leaning towards collection index
	-Enable drawing a card

BUGS:
	-PLAYER NUMBER
		-If two players join in rapid (not that rapid) succession, server will consider both players to be player 0