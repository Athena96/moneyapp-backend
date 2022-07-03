import { CognitoHelper } from "../../utilities/CognitoHelper";
import { DynamoDBHelper } from "../../utilities/DynamoDBHelper";
import { deleteAccount } from "./deleteAccountManager";
import { deleteSimulation } from "./deleteSimulationManager";

export enum DeleteType {
    DeleteAccount = 'DeleteAccount',
    DeleteSimulation = 'DeleteSimulation',
}
export type DeleteEvent = {
    deleteCommand: string,
    email: string,
    simulationId?: string
}

export class DeleteManager {

    async delete(event: DeleteEvent, dynamoDBHelper: DynamoDBHelper, cognitoHelper: CognitoHelper) {
        console.log("delete manager")
        console.log(`event: ${JSON.stringify(event)}`)
        
        const command: string = event.deleteCommand;
        switch (command) {
            case DeleteType.DeleteAccount.toString():
                await deleteAccount(event, dynamoDBHelper, cognitoHelper);
                break;
            case DeleteType.DeleteSimulation.toString():
                await deleteSimulation(event, dynamoDBHelper);
                break;
        }
    
    }

}