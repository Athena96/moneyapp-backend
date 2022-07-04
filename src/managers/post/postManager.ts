import { CognitoHelper } from "../../utilities/CognitoHelper";
import { DynamoDBHelper } from "../../utilities/DynamoDBHelper";
import { createSimulation } from "./createSimulationManager";
import { runSimulation } from "./runSimulationManager";

export enum PostType {
    CreateSimulation = 'CreateSimulation',
    RunSimulation = 'RunSimulation',
}
export type PostEvent = {
    postCommand: string,
    email: string,
    simulationId?: string
}

export class PostManager {

    static async post(event: PostEvent, dynamoDBHelper: DynamoDBHelper, finnhubClient: any) {
        console.log("post manager")
        console.log(`event: ${JSON.stringify(event)}`)
        
        const command: string = event.postCommand;
        switch (command) {
            case PostType.CreateSimulation.toString():
                await createSimulation(event, dynamoDBHelper);
                break;
            case PostType.RunSimulation.toString():
                await runSimulation(event, dynamoDBHelper, finnhubClient);
                break;
        }
    
    }

}