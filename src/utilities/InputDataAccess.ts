
import { Input } from '../models/Input';
import { DynamoDB } from 'aws-sdk';
import { DynamoDBHelper } from './DynamoDBHelper';
import { tableForType } from './constants';
import { Allocations } from '../models/Allocations';
import { AssetAllocation, GlidePath } from '../models/AssetAllocation';

export class InputDataAccess {

    static inputsMapperFunction(input: DynamoDB.AttributeMap) {
        const id = input['id'].S || ""
        const birthday =new Date(input['birthday'].S || "")
        const firstSignIn = input['firstSignIn'].BOOL || false


        const startAllocations = new Allocations(input['assetAllocation'].M!['startAllocations'].M!['equities'].S!,
        input['assetAllocation'].M!['startAllocations'].M!['bonds'].S!,
        input['assetAllocation'].M!['startAllocations'].M!['cash'].S!)
        let endAllocations: Allocations | undefined = undefined;
        let glidePath: GlidePath | undefined = undefined;
        if (input['assetAllocation'].M!['endAllocations'] && input['assetAllocation'].M!['glidePath']) {
            endAllocations = new Allocations(input['assetAllocation'].M!['endAllocations'].M!['equities'].S!,
            input['assetAllocation'].M!['endAllocations'].M!['bonds'].S!,
            input['assetAllocation'].M!['endAllocations'].M!['cash'].S!);

            switch(input['assetAllocation'].M!['glidePath'].S!) {
                case "Evenly":
                    glidePath = GlidePath.Evenly
                    break;
                case "Quickly":
                    glidePath = GlidePath.Quickly
                    break;
                case "Slowly":
                    glidePath = GlidePath.Slowly
                    break;
            }
        }
        const allocations = new AssetAllocation(startAllocations, endAllocations, glidePath);
        const simulation = input['simulation'].S || ""
        return new Input(id, birthday, firstSignIn, allocations, simulation);
    }

    static async fetchInputs(dynamoDBHelper: DynamoDBHelper, simulationId: string) {
        let fetchedInput: Input;
        fetchedInput = (await dynamoDBHelper.fetchAllOf<Input>('Input', this.inputsMapperFunction, simulationId))[0];
        return fetchedInput;
    }

    static async deleteDataWithSimulationId(dynamoDBHelper: DynamoDBHelper, simulationId: string) {
        const input = await this.fetchInputs(dynamoDBHelper, simulationId);
        if (!input) {
            console.log(`no input data to delete, skipping`);
            return;
        }
        
        console.log(`fetched input to delete: ${JSON.stringify(input)}`)
        await dynamoDBHelper.deleteObject<Input>({
            Key: {
                "id": {
                    S: input.id
                }
            },
            ReturnValues: "NONE",
            TableName: tableForType['Input']
        });
    }
}