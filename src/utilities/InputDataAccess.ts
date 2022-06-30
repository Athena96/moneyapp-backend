
import { Input } from '../models/Input';
import { DynamoDB } from 'aws-sdk';
import { DynamoDBHelper } from './DynamoDBHelper';

export class InputDataAccess {

    static inputsMapperFunction(input: DynamoDB.AttributeMap) {
        const id = input['id'].S || ""
        const settings = input['settings'].S || ""
        const simulation = input['simulation'].S || ""
        return new Input(id, settings, simulation);
    }

    static async fetchInputs(dynamoDBHelper: DynamoDBHelper, simulationId: string) {
        let fetchedInput: Input;
        fetchedInput = (await dynamoDBHelper.fetchAllOf<Input>('Input', this.inputsMapperFunction, simulationId))[0];
        return fetchedInput;
    }
}