import { AccountDataAccess } from "../../utilities/AccountDataAccess";
import { BudgetDataAccess } from "../../utilities/BudgetDataAccess";
import { CognitoHelper } from "../../utilities/CognitoHelper";
import { tableForType } from "../../utilities/constants";
import { DataAccess } from "../../utilities/DataAccess";
import { DynamoDBHelper } from "../../utilities/DynamoDBHelper";
import { SimulationDataAccess } from "../../utilities/SimulationDataAccess";
import { DeleteEvent } from "./deleteManager";


export const deleteAccount = async (event: DeleteEvent, ddbHelper: DynamoDBHelper, cognitoHelper: CognitoHelper): Promise<void> => {
    console.log('deleteAccount')

    const user = event.email;
    console.log('user ' + user)

    // list all simulations for account
    const simulations = await SimulationDataAccess.fetchAllSimulationsForUser(ddbHelper, user);

    // for each sim in simulation
    for (const simulation of simulations) {
        console.log(`deleting data for sim: ${simulation.name}`)
       
        for (const type of Object.keys(tableForType)) {
            console.log(`deleting data for sim in table: ${type}: ${tableForType[type]}`)
            await DataAccess.deleteDataWithSimulationId(type, ddbHelper, simulation.id);
        }
    }

    // delete cognito user
    console.log(`deleting user: ${user}`)
    await cognitoHelper.deleteUser(user);

    console.log('done')

}