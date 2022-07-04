import { Context } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';
import { DeleteEvent, DeleteManager } from '../managers/delete/deleteManager';
import { CognitoHelper } from '../utilities/CognitoHelper';
import { DynamoDBHelper } from '../utilities/DynamoDBHelper';

const cognitoClient = new CognitoIdentityServiceProvider({ region: process.env.AWS_REGION });
const ddbClient = new DynamoDB({ region: process.env.AWS_REGION });
const dynamoDBHelper = new DynamoDBHelper(ddbClient);
const cognitoHelper = new CognitoHelper(cognitoClient);

export const handler = async (event: DeleteEvent, context: Context | null): Promise<void> => {
    console.log("delete handler");
    console.log(JSON.stringify(event));
    try {
        await DeleteManager.delete(event, dynamoDBHelper, cognitoHelper)
    } catch (e) {
        console.error(e);
    }
}