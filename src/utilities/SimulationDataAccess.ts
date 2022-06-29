
import { Simulation } from '../Models/Simulation';
import { DynamoDB } from 'aws-sdk';
import { DynamoDBHelper } from './DynamoDBHelper';
import { MonteCarloRowData } from './MonteCarlo';
import { tableForType } from './constants';
import { SimulationStatus } from '../Models/SimulationTypes';

export class SimulationDataAccess {

    static simulationsMapperFunction(input: DynamoDB.AttributeMap) {
        const id = input['id'].S || ""
        const name = input['name'].S || ""
        const lastComputed = new Date(input['lastComputed'].S || "")
        const selected = Number(input['selected'].N || "0")
        const succesPercent = input['successPercent'].S || ""
        const simulationData = input['simulationData'].S || ""
        const user = input['user'].S || ""
        const status = (input['status']?.S || "") === "Running" ? SimulationStatus.Running : SimulationStatus.Done;
        return new Simulation(id, name, selected, succesPercent, simulationData, lastComputed, user, status);
    }

    static async markSimulationAsRunning(dynamoDBHelper: DynamoDBHelper, user: string) {
        const sim = await this.fetchSelectedSimulationForUser(dynamoDBHelper, user);
        await this.setSimulationStatus(dynamoDBHelper, sim.id, SimulationStatus.Running);
    }

    static async fetchSelectedSimulationForUser(dynamoDBHelper: DynamoDBHelper, user: string) {
        let fetchedSimulations: Simulation[] = [];
        fetchedSimulations = await dynamoDBHelper.fetchAllOf<Simulation>('Simulation', this.simulationsMapperFunction, null);

        for (const sim of fetchedSimulations) {
            if (sim.selected === 1 && sim.user === user) {
                return sim;
            }
        }
        throw new Error("No Selected Simulation")
    }

    static async setSimulationStatus(dynamoDBHelper: DynamoDBHelper, simulationId: string, status: SimulationStatus) {
        const params = {
            ExpressionAttributeNames: {
                "#SU": "status"
            },
            ExpressionAttributeValues: {
                ":sts": {
                    S: status
                }
            },
            Key: {
                "id": {
                    S: simulationId
                }
            },
            ReturnValues: "NONE",
            TableName: tableForType['Simulation'],
            UpdateExpression: "SET #SU = :sts"
        };
        await dynamoDBHelper.updateObject<Simulation>(params);
    }

    static async updateSimulation(dynamoDBHelper: DynamoDBHelper, 
        originalSim: Simulation, 
        lastComputed: Date, 
        succesPercent: number, 
        status: SimulationStatus, 
        simulationData: MonteCarloRowData[]) {
        const params = {
            ExpressionAttributeNames: {
                "#LC": "lastComputed",
                "#SD": "simulationData",
                "#SP": "successPercent",
                "#SU": "status"
            },
            ExpressionAttributeValues: {
                ":vlc": {
                    S: lastComputed.toISOString()
                },
                ":vsd": {
                    S: JSON.stringify(simulationData)
                },
                ":vsp": {
                    S: succesPercent.toFixed(2)
                },
                ":sts": {
                    S: status
                }
            },
            Key: {
                "id": {
                    S: originalSim.getKey()
                }
            },
            ReturnValues: "NONE",
            TableName: tableForType['Simulation'],
            UpdateExpression: "SET #LC = :vlc, #SD = :vsd, #SU = :sts, #SP = :vsp"
        };
        await dynamoDBHelper.updateObject<Simulation>(params);
    }

}