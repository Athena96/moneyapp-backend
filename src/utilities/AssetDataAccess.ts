
import { Asset } from '../models/Asset';
import { DynamoDB } from 'aws-sdk';
import { DynamoDBHelper } from './DynamoDBHelper';
import { tableForType } from './constants';

export class AssetDataAccess {

    static assetsMapperFunction(input: DynamoDB.AttributeMap) {
        const id = input['id'].S || ""
        const ticker = input['ticker'].S || ""
        const quantity = Number(input['quantity'].N || "0")
        const hasIndexData = Number(input['hasIndexData'].N || "0");
        const account = input['account'].S || ""
        const isCurrency = Number(input['isCurrency'].N || "");
        return new Asset(id, ticker, quantity, hasIndexData, account, isCurrency);
    }

    static async fetchAssets(dynamoDBHelper: DynamoDBHelper, simulationId: string) {
        let fetchedAssets: Asset[] = [];
        fetchedAssets = await dynamoDBHelper.fetchAllOf<Asset>('Asset', this.assetsMapperFunction, simulationId);
        return fetchedAssets;
    }

    static async deleteDataWithSimulationId(dynamoDBHelper: DynamoDBHelper, simulationId: string) {
        const assets = await this.fetchAssets(dynamoDBHelper, simulationId);
        if (!assets) {
            console.log(`no assets data to delete, skipping`);
            return;
        }
        console.log(`fetched assets to delete: ${JSON.stringify(assets)}`)

        for (const asset of assets) {
            await dynamoDBHelper.deleteObject<Asset>({
                Key: {
                    "id": {
                        S: asset.id
                    }
                },
                ReturnValues: "NONE",
                TableName: tableForType['Asset']
            })
        }
    }

}