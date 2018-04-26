var request = require('request');

const SLACK_URL = process.env.SLACK_URL;

exports.handler = (event, context, callback) => {
    request(generateRequestDetails(event, SLACK_URL), function (err, res, body) {
        if (res && (res.statusCode === 200 || res.statusCode === 201)) {
            callback(null, 'Done');
        }
        else {
            console.log('Error: ' + err + ' ' + res + ' ' + body);
            callback('Error');
        }
    });
};

function generateMessageByActionType(eventDetail) {
    var actionType = eventDetail.type.category
    var message = {};
    switch (actionType) {
        case 'Approval':
            message = {
                started: 'requires approval',
                succeeded: 'has been Approved',
                failed: 'has failed'
            };
            break;
        case 'Source':
            message = {
                started: 'has *started* pulling source from the repository',
                succeeded: 'has *finished* pulling the source from the repository',
                failed: 'was unable to pull the source from the repository'
            };
            break;
        case 'Build':
            message = {
                started: "has *started* building the application",
                succeeded: 'has *finished* building the application',
                failed: 'has *failed* building the application'
            }
            break;
        case 'Test':
            message = {
                started: 'has *started* testing of the application',
                succeeded: "has *finished* testing the application",
                failed: "has *failed* testing the application",
            };
            break;
        case 'Deploy':
            message = { 
                started: 'has *started* deploying new version of the application',
                succeeded: 'has *finished* deploying new version of the application',
                failed: 'has *failed* deploying the new version of the application'
            };
            break;
        case 'Invoke':
            message = {
                started: 'started invoking',
                succeeded: 'has finished invoking'
            };
            break;
        default:
            break;
    }

    return message;
}
function generateRequestDetails(event, url) {
    if (event['detail-type'] != "CodePipeline Action Execution State Change")
        throw new Error ("Unsupported detail type: " + event['detail-type']);
    var message = generateMessageByActionType(event.detail);
    var color;
    var pipeline = event.detail.pipeline;
    var text = "*"+event.detail.stage+"* ";
    
    var pipelineState = event.detail.state;
    if (pipelineState == 'STARTED') {
        color = "#38d";
        text += message.started;
    }
    else if (pipelineState == 'SUCCEEDED') {
        console.log("EVENT", event, "URL", url);
        color = "good";
        text += message.succeeded;
    }
    else if (pipelineState == 'FAILED') {
        color = "danger";
        text += message.failed
    }
    else {
        color = "warning";
        text += "has " + pipelineState + " (This is an unknown state to the Slack notifier.)";
    }
    var ts = Date.now() / 1000;
    console.log('Posting following message to Slack: ' + text);

    var options = {
        url: url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        json: {
            attachments: [{
                author_name: pipeline,
                text: text, 
                color: color,
                ts: ts
            }]
        }
    };

    return options;
}

exports.__test__ = {
    generateRequestDetails: generateRequestDetails
};
