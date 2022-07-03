import { AccountDataAccess } from "./AccountDataAccess";
import { AssetDataAccess } from "./AssetDataAccess";
import { BudgetDataAccess } from "./BudgetDataAccess";
import { DynamoDBHelper } from "./DynamoDBHelper";
import { EventDataAccess } from "./EventDataAccess";
import { InputDataAccess } from "./InputDataAccess";
import { SimulationDataAccess } from "./SimulationDataAccess";

export class DataAccess {

    static async deleteDataWithSimulationId(type: string, ddbHelper: DynamoDBHelper, simulationId: string) {
  
        console.log(`deleteDataWithSimulationId: ${type}`)

        switch(type) {
            case 'Account':
                await AccountDataAccess.deleteDataWithSimulationId(ddbHelper, simulationId);
                break;
            case 'Budget':
                await BudgetDataAccess.deleteDataWithSimulationId(ddbHelper, simulationId);
                break;
            case 'Event':
                await EventDataAccess.deleteDataWithSimulationId(ddbHelper, simulationId);
                break;
            case 'Input':
                await InputDataAccess.deleteDataWithSimulationId(ddbHelper, simulationId);
                break;
            case 'Asset':
                await AssetDataAccess.deleteDataWithSimulationId(ddbHelper, simulationId);
                break;
            case 'Simulation':
                await SimulationDataAccess.deleteDataWithSimulationId(ddbHelper, simulationId);
                break;
        }
    
    }

}