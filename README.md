# Cuttle_Angular

a [Sails](http://sailsjs.org) application



PREVIOUS:
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
	-Clean up Socket organization in app.js in GameController
	-Fix Front end to display only YOUR CARDS
	-Enable shuffling
		-DECIDE BETWEEN USING COLLECTION INDEX VS SYNTHETIC INDEX
			-Leaning towards collection index
	-Enable drawing a card