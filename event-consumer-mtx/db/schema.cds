namespace event.consumer.mtx.db;
using { cuid } from '@sap/cds/common';

entity Messages : cuid {
    logDateTime: DateTime;
    consumedMessage : String(512);
};

