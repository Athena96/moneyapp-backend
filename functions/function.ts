import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';



export const lambdaHandler = async (event: null, context: null): Promise<String | void> => {
  console.log('invoked')
  return "Success";
}
