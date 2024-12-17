namespace event.consumer.mtx.srv;
using { event.consumer.mtx.db as db } from '../db/schema';

@path: '/event-consumer'
@requires: 'authenticated-user'
service EventConsumer {
    type Message {
        event   : String;
        content : String;
    }

    entity Messages as projection on db.Messages;
    
    action consumeMessage(msg : Message) returns Boolean; 
}