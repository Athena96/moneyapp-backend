import { Context } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';
import { PostEvent, PostManager } from '../managers/post/postManager';
import { CognitoHelper } from '../utilities/CognitoHelper';
import { DynamoDBHelper } from '../utilities/DynamoDBHelper';
import { FinnHubClientHelper } from '../utilities/FinnHubClientHelper';


const ddbClient = new DynamoDB({ region: process.env.AWS_REGION });
const dynamoDBHelper = new DynamoDBHelper(ddbClient);

const finnhubClient = FinnHubClientHelper.getFinnhubClient();

export const handler = async (event: PostEvent, context: Context | null): Promise<void> => {
    console.log("post handler");
    console.log(JSON.stringify(event));
    try {
        await PostManager.post(event, dynamoDBHelper, finnhubClient)
    } catch (e) {
        console.error(e);
    }
}