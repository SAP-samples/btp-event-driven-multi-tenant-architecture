using {event.consumer.mtx.srv.EventConsumer as srv} from './service';

annotate srv.Messages with {
    ID               @(
        Common: {
            Label: 'ID',
            Text : {
                $value                : consumedMessage,
                ![@UI.TextArrangement]: #TextOnly,
            }
        },
        UI    : {Hidden: true}
    )                                                          @readonly;
    logDateTime      @(Common: {Label: 'Timestamp'}, )         @readonly;
    consumedMessage  @(Common: {Label: 'Consumed Message'}, )  @readonly;
};

annotate srv.Messages @(
    Capabilities: {
        SearchRestrictions: {
            $Type     : 'Capabilities.SearchRestrictionsType',
            Searchable: true
        },
        Insertable        : false,
        Deletable         : true,
        Updatable         : false
    },
    UI          : {
        UpdateHidden       : true,
        DeleteHidden       : false,
        CreateHidden       : true,
        Identification     : [{Value: consumedMessage}],
        PresentationVariant: {
            SortOrder     : [{
                Property  : logDateTime,
                Descending: true
            }],
            Visualizations: ['@UI.LineItem'],
        },
        HeaderInfo         : {
            TypeName      : 'Message',
            TypeNamePlural: 'Messages',
            Title         : {
                $Type: 'UI.DataField',
                Value: consumedMessage,
            },
            Description   : {
                $Type: 'UI.DataField',
                Value: logDateTime,
            }
        },
        SelectionFields    : [
            logDateTime,
            consumedMessage
        ],
        LineItem           : [
            {
                $Type: 'UI.DataField',
                Value: logDateTime
            },
            {
                $Type: 'UI.DataField',
                Value: consumedMessage
            }
        ],
        FieldGroup #General: {
            $Type: 'UI.FieldGroupType',
            Data : [
                {
                    $Type: 'UI.DataField',
                    Value: logDateTime
                },
                {
                    $Type: 'UI.DataField',
                    Value: consumedMessage
                }
            ],
        },
        Facets             : [{
            $Type : 'UI.ReferenceFacet',
            ID    : 'General',
            Label : 'General',
            Target: '@UI.FieldGroup#General'
        }]
    }
);
