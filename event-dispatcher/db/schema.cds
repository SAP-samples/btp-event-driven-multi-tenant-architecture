namespace event.dispatcher.db;

@assert.unique: {messageSource: [messageSource]}
entity Tenants {
    key tenantId      : String(38);
        subDomain     : String(38);
        url           : String(512);
        messageSource : String(32);
}
