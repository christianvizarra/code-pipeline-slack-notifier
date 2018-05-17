var request = require('request');

const SLACK_URL = process.env.SLACK_URL;

exports.handler = (event, context, callback) => {
    request(generateRequestDetails(event, SLACK_URL), function (err, res, body) {
        if (res && (res.statusCode === 200 || res.statusCode === 201)) {
            callback(null, 'Done');
        }
        else {
            callback('Error');
        }
    });
};

function generateMessageByActionType(eventDetail) {
    var actionType = eventDetail.type.category;
    var provider = eventDetail.type.provider;
    var message = {};
    switch (actionType) {
        case 'Approval':
            message = {
                started: 'deployment requires approval',
                succeeded: 'deployment has been Approved',
                failed: 'deployment has been denied'
            };
            break;
        case 'Source':
            message = {
                started: 'stage *started* pulling source from '+provider+' repository',
                succeeded: 'stage *finished* pulling the source from '+provider+' repository',
                failed: 'stage was unable to pull the source from '+provider+' repository'
            };
            break;
        case 'Build':
            message = {
                started: "environment has *started* building via "+provider,
                succeeded: 'environment has *finished* building via '+provider,
                failed: 'environment has *failed* building '+provider
            }
            break;
        case 'Test':
            message = {
                started: 'environment has *started* testing of the application',
                succeeded: "environment has *finished* testing the application",
                failed: "environment has *failed* testing the application",
            };
            break;
        case 'Deploy':
            message = { 
                started: 'environment has *started* deploying new version on '+provider,
                succeeded: 'environment has *finished* deploying new version on '+provider,
                failed: 'environment has *failed* deploying the new version on '+provider
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
        color = "good";
        text = ":white_check_mark: " + text + message.succeeded;
    }
    else if (pipelineState == 'FAILED') {
        color = "danger";
        text = ":x: " + text + message.failed
    }
    else {
        color = "warning";
        text += "has " + pipelineState + " (This is an unknown state to the Slack notifier.)";
    }
    var ts = Date.now() / 1000;
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
