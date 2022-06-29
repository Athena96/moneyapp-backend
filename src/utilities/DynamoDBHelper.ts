import { DynamoDB } from 'aws-sdk';
import { tableForType } from './constants';

export class DynamoDBHelper {
    private ddbClient: DynamoDB;

    constructor(ddbClient: DynamoDB) {
        this.ddbClient = ddbClient;
    }

    async updateObject<Type>(input: DynamoDB.UpdateItemInput): Promise<void> {
        await this.ddbClient.updateItem(input).promise();
    }

    async fetchAllOf<Type>(dataType: string, mapperFunction: (input: DynamoDB.AttributeMap) => Type, simulationId: string | null): Promise<Type[]>  {
        let data = null;
        let key = undefined;

        let allData: Type[] = []

        do {
            // #todo where simulation === the selected simulation.
           data = await this.ddbClient.scan({
                TableName: tableForType[dataType],
                Limit: 25,
                ExclusiveStartKey: key
            }).promise();

            key = data.LastEvaluatedKey;

            if (data.Items) {
                for (const item of data.Items) {
                    if (simulationId && item['simulation'] && item['simulation'].S) {
                        if (simulationId === item['simulation'].S) {
                            allData.push(mapperFunction(item));
                        }
                    } else {
                        allData.push(mapperFunction(item));
                    }
                }
            }
        } while(key);

        return allData;
    }

       
}