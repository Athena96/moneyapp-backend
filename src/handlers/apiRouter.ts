

import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { Lambda } from 'aws-sdk';

enum HttpMethod {
    DELETE,
    POST
}


const lambdaClient = new Lambda({ region: process.env.AWS_REGION });


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
                message: 'failed',
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
            console.log(`calling ${process.env.DELETE_FUNCTION_NAME!}`)
            // await lambdaClient.invoke({
            //     FunctionName: process.env.DELETE_FUNCTION_NAME!,
            //     InvocationType: "Event",
            //     Payload: JSON.stringify({
            //         email: inputEmail
            //     })
            // }).promise();
            console.log(`invoked lamnbda.`)
            break;
        case HttpMethod[HttpMethod.POST]:
            console.log(`HttpMethod.POST`)
            console.log(`calling ${process.env.POST_FUNCTION_NAME!}`)
            // await lambdaClient.invoke({
            //     FunctionName: process.env.POST_FUNCTION_NAME!,
            //     InvocationType: "Event",
            //     Payload: JSON.stringify({
            //         email: inputEmail
            //     })
            // }).promise();
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
