# Cuttle_Angular

a [Sails](http://sailsjs.org) application



PREVIOUS:
	-Finished pushStack 1st draft
	-Enabled Glasses Eight
		-Glasses reveal opponent's hand and do not count for points
		-Glasses still get the card class, so they are a little small
		-Controller code is kinda gross: awkward double-placement of game stuff (publishUpdate() and send() ) that should be called once at the bottom
			-This is to combat the GODDAMNED ASYNCHRONICITY
	-Added gamelog
		-Improved Card.alt for better readability 
			-Still only reads number of rank (use bigger switch statement to read rank as a word ie 1 = One, 13 = King)
	-Fixed toField to check for a jack in the proper place and time
	-Enabled victory
	-Enabled playing a card to the field
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

	-Enable One-Off Effects
		-Begin collapseStack
		-Server doesn't need it to be your turn to pushStack
			-Ensure this can't be played out of turn inappropriately
	-Clean up DOM
		-Make space for hands and fields before they are filled with cards

	-Fix playerNum bug
		-Change timing of Card creation loop and display a loading screen while users wait
			-Instantiate cards when 2nd player joins?


BUGS:
	-PLAYER NUMBER
		-If two players join in rapid (not that rapid) succession, server will consider both players to be player 0
	-HOMEPAGE GAMEDISPLAY
		-The first tab to load the homepage occasionally doesn't get updated when games are created (including its own creations)
	-toField
		-A jack was played to the field like a point card
		-Sometimes a point card can't be played to the field if you have a jack in hand
			-Have been unable to replicate the bug
			-CONDITIONAL CHECKS WRONG CARD
				-USE SORTED HANDS
	-Scuttling
		-Indices of cards in field are off
		-Scrap pile sometimes only registers as the cards newly added to it
			-It seemed to be a problem with draw()
				-the game wasn't fully populated, so saving it, deleted the scrap attribute
		-Player seems to have hand and field deleted?
			-running consecutive save() methods caused the fuckup for UNKNOWN REASONS
				-Making the second save() happen inside a callback passed to the first save() fixed it ????

	-FINDING CARDS
		-PopulateAll() after querying for cards to ensure no lost associations
