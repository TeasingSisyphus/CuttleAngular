# Cuttle_Angular

a [Sails](http://sailsjs.org) application



PREVIOUS:
	-The original html page now contains both the homepage (game creation form and list of games), and the gameView
		-Homepage is hidden when the gameView is revealed and vice-versa
	-Client can request to be subscribed to a game

NEXT:
	-Update clients on homepage when a game becomes full
		-May require implementing DisplayGame model to avoid subscribing sockets to games to which they do not belong
	-Instantiate Deck
	