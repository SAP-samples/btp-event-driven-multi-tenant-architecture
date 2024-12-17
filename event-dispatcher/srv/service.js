const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

module.exports = cds.service.impl(async function () {
    const { Tenants } = this.entities;

    const consumerDest = await getDestination({ destinationName: 'Event-Consumer' });
    const tokenServiceURL = consumerDest.originalProperties.destinationConfiguration.tokenServiceURL;

    // Get the tenant URL according to the tenant registration (if any)
    async function getTenantUrl(source) {
        let url = null;
        try {
            const tenant = await SELECT.one.from(Tenants).where({ messageSource: source });
            if (tenant)
                url = tenant.url + '/event-consumer/consumeMessage';
            else {
                const newTenant = await SELECT.one.from(Tenants).where({ messageSource: 'new-tenant' });
                if (newTenant) {
                    await UPDATE(Tenants, newTenant.tenantId).with({ messageSource: source });
                    url = newTenant.url + '/event-consumer/consumeMessage';
                }
            }
        } catch (error) {
            console.log('getTenantUrl error: ', error.message);
        }
        return url;
    }
    // Get the token service URL according to the tenant registration (if any)
    async function getTokenServiceUrl(source) {
        let url = null;
        try {
            const tenant = await SELECT.one.from(Tenants).where({ messageSource: source });
            if (tenant)
                url = tokenServiceURL.replace('subDomain', tenant.subDomain);
            else {
                const newTenant = await SELECT.one.from(Tenants).where({ messageSource: 'new-tenant' });
                if (newTenant) {
                    await UPDATE(Tenants, newTenant.tenantId).with({ messageSource: source });
                    url = tokenServiceURL.replace('subDomain', tenant.subDomain);
                }
            }
        } catch (error) {
            console.log('getTokenServiceUrl error: ', error.message);
        }
        return url;
    }
    // Get fresh OAuth token for the consumer destination
    async function getAuthToken() {
        try {
            const config = '{ "Authorization" : "Basic ' + btoa(consumerDest.clientId + ":" + consumerDest.clientSecret) + '", "Content-Type" : "application/x-www-form-urlencoded" }';
            const resp = await executeHttpRequest(
                { url: consumerDest.tokenServiceUrl },
                {
                    method: "POST",
                    headers: {
                        requestConfig: JSON.parse(config)
                    },
                    data: {
                        grant_type: "client_credentials"
                    }
                },
                { fetchCsrfToken: false }
            );
            return resp.data;
        } catch (error) {
            console.log('getAuthToken error: ', error.message);
        }
    }
    // Forward (POST) the message to the specified URL
    async function forwardMessage(url, tokenServiceUrl, payload) {
        try {
            consumerDest.originalProperties.destinationConfiguration.URL = url;
            consumerDest.originalProperties.destinationConfiguration.tokenServiceURL = tokenServiceUrl;
            consumerDest.url = url;
            consumerDest.tokenServiceUrl = tokenServiceUrl;
            const authToken = await getAuthToken();
            consumerDest.authTokens[0].type = authToken.token_type;
            consumerDest.authTokens[0].value = authToken.access_token;
            consumerDest.authTokens[0].expiresIn = authToken.expires_in;
            consumerDest.authTokens[0].error = null;
            consumerDest.authTokens[0].http_header = {
                key: "Authorization",
                value: "Bearer " + consumerDest.authTokens[0].value
            };
            const resp = await executeHttpRequest(consumerDest, { method: 'POST', data: payload }, { fetchCsrfToken: false });
        } catch (error) {
            console.log('forwardMessage error: ', error.message);
        }
    }

    const messaging = await cds.connect.to('messaging');
    // "Listen" to the CHANGE topic for the Business Partner BO
    messaging.on('s4/msg/client01/ce/sap/s4/beh/businesspartner/v1/BusinessPartner/Changed/v1', async (msg) => {
        try {
            const payload = {
                msg: {
                    event: 'changed',
                    content: JSON.stringify(msg.data)
                }
            }
            const url = await getTenantUrl(msg.headers.source);
            const tokenServiceUrl = await getTokenServiceUrl(msg.headers.source);
            if (url) await forwardMessage(url, tokenServiceUrl, payload);
        } catch (error) {
            console.log('Message processing error (CHANGE event): ', error.message);
        }
    });
    // "Listen" to the CREATE topic for the Business Partner BO
    messaging.on('s4/msg/client01/ce/sap/s4/beh/businesspartner/v1/BusinessPartner/Created/v1', async (msg) => {
        try {
            const payload = {
                msg: {
                    event: 'created',
                    content: JSON.stringify(msg.data)
                }
            }
            const url = await getTenantUrl(msg.headers.source);
            const tokenServiceUrl = await getTokenServiceUrl(msg.headers.source);
            if (url) await forwardMessage(url, tokenServiceUrl, payload);
        } catch (error) {
            console.log('Message processing error (CREATE event): ', error.message);
        }
    });

    // Register a tenant to start dispatching
    this.on('registerTenant', async (req) => {
        let result = true;
        try {
            const { tenant } = req.data;
            const entries = [
                {
                    tenantId: tenant.id,
                    subDomain: tenant.subDomain,
                    url: tenant.url,
                    messageSource: tenant.source
                }
            ];
            await INSERT.into(Tenants).entries(entries);
        } catch (error) {
            console.log('registerTenant error: ', error.message);
            result = false;
        }
        return result;
    });

    // Unregister a tenant to stop dispatching
    this.on('unregisterTenant', async (req) => {
        let result = true;
        try {
            const { tenant } = req.data;
            await DELETE.from(Tenants).where({ tenantId: tenant.id });
        } catch (error) {
            console.log('unregisterTenant error: ', error.message);
            result = false;
        }
        return result;
    });
});

