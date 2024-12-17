module.exports = cds.service.impl(async function () {
    const { Messages } = this.entities;

    // Consume a message from the dispatcher
    this.on('consumeMessage', async (req) => {
        let result = true;
        try {
            const { msg } = req.data;
            // console.log("Message received: ", msg);
            const content = JSON.parse(msg.content);
            const entries = [
                {
                    logDateTime: Date.now(),
                    consumedMessage: 'Business Partner "' + content.BusinessPartner + '" has been ' + msg.event + '.'
                }
            ];
            await INSERT.into(Messages).entries(entries);
        } catch (error) {
            console.log('consumeMessage error: ', error.message);
            result = false;
        }
        return result;
    });
});