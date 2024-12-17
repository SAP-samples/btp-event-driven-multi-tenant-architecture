using {event.dispatcher.db as db} from '../db/schema';

@path    : '/event-dispatcher'
@requires: 'authenticated-user'
service EventDispatcher {
    type Tenant {
        id        : String(38);
        subDomain : String(38);
        url       : String(512);
        source    : String(32);
    }

    entity Tenants as projection on db.Tenants;
    
    action registerTenant(tenant : Tenant)   returns Boolean;
    action unregisterTenant(tenant : Tenant) returns Boolean;
}
