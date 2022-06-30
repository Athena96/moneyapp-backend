

import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { Lambda } from 'aws-sdk';

enum HttpMethod {
    DELETE,
    POST
}


const lambdaClient = new Lambda({ region: process.env.AWS_REGION });
const DELETE_FUNCTION_NAME = process.env.DELETE_FUNCTION_NAME!;
const POST_FUNCTION_NAME = process.env.POST_FUNCTION_NAME!;

export const handler = async (event: APIGatewayEvent | null, context: Context | null): Promise<APIGatewayProxyResult | String> => {
    console.log("spendingApiRouter");
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));

    if (!event || !context) {
      return "done"
    }
    const inputEmail = event?.queryStringParameters?.email;
    if (!inputEmail) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'failed: no input email',
            }),
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE"
            }
        };
    }

    const inputCommand = event?.queryStringParameters?.command;
    console.log('inputCommand ' + inputCommand)
    if (!inputCommand) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'failed: no input command',
            }),
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE"
            }
        };
    }

    const method = event.httpMethod;
    switch (method) {
        case HttpMethod[HttpMethod.DELETE]:
            console.log(`HttpMethod.DELETE`)
            console.log(`calling ${DELETE_FUNCTION_NAME}`)
            await lambdaClient.invoke({
                FunctionName: DELETE_FUNCTION_NAME,
                InvocationType: "Event",
                Payload: JSON.stringify({
                    email: inputEmail,
                    deleteCommand: inputCommand
                })
            }).promise()
            console.log(`invoked lamnbda.`)
            break;
        case HttpMethod[HttpMethod.POST]:
            console.log(`HttpMethod.POST`)
            console.log(`calling ${POST_FUNCTION_NAME}`)
            await lambdaClient.invoke({
                FunctionName: POST_FUNCTION_NAME,
                InvocationType: "Event",
                Payload: JSON.stringify({
                    email: inputEmail,
                    postCommand: inputCommand
                })
            }).promise();
            console.log(`invoked lamnbda.`)
            break;
    }


    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'done',
        }),
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE"
        }
    };
}
