





import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { Lambda } from 'aws-sdk';

const lambdaClient = new Lambda({ region: process.env.AWS_REGION });

export const handler = async (event: APIGatewayEvent |  null, context: Context | null): Promise<APIGatewayProxyResult | void | String> => {
    console.log("spendingApiRouter");
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));

    if (!event && !context) {
        return "done"
    }
}