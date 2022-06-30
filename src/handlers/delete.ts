





import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';


export const handler = async (event: APIGatewayEvent |  null, context: Context | null): Promise<APIGatewayProxyResult | void | String> => {
    console.log("spendingApiRouter");
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));

    if (!event && !context) {
        return "done"
    }
}