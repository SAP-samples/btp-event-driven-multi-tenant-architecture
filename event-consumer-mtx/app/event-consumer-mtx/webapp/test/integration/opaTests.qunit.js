sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'eventconsumermtx/test/integration/FirstJourney',
		'eventconsumermtx/test/integration/pages/MessagesList',
		'eventconsumermtx/test/integration/pages/MessagesObjectPage'
    ],
    function(JourneyRunner, opaJourney, MessagesList, MessagesObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('eventconsumermtx') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheMessagesList: MessagesList,
					onTheMessagesObjectPage: MessagesObjectPage
                }
            },
            opaJourney.run
        );
    }
);