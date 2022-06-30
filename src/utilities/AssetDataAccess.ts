
import { Asset } from '../models/Asset';
import { DynamoDB } from 'aws-sdk';
import { DynamoDBHelper } from './DynamoDBHelper';

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

}