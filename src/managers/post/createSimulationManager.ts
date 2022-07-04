
import { CognitoHelper } from "../../utilities/CognitoHelper";
import { DynamoDBHelper } from "../../utilities/DynamoDBHelper";
import { PostEvent } from "./postManager";

export const createSimulation = async (event: PostEvent, ddbHelper: DynamoDBHelper): Promise<void> => {
    console.log('createSimulation')
    console.log(`event ${JSON.stringify(event)}`)
}