
import { DynamoDB } from 'aws-sdk';
import { Account } from '../models/Account';
import { tableForType } from './constants';
import { DynamoDBHelper } from './DynamoDBHelper';

export class AccountDataAccess {

    static accountsMapperFunction(input: DynamoDB.AttributeMap) {
        const id = input['id'].S || ""
        const name = input['name'].S || ""
        const taxAdvantaged = Number(input['taxAdvantaged']?.N || 0)
        const contributionPercent = Number(input['contributionPercent']?.N || 0.0)

        return new Account(id, name, taxAdvantaged, contributionPercent);
    }

    static async fetchAccounts(dynamoDBHelper: DynamoDBHelper, simulationId: string) {
        let fetchedAccounts: Account[] = [];
        fetchedAccounts = await dynamoDBHelper.fetchAllOf<Account>('Account', this.accountsMapperFunction, simulationId);
        return fetchedAccounts;
    }

    static async deleteDataWithSimulationId(dynamoDBHelper: DynamoDBHelper, simulationId: string) {
        const accounts = await this.fetchAccounts(dynamoDBHelper, simulationId);
        if (!accounts) {
            console.log(`no account data to delete, skipping`);
            return;
        }
        console.log(`fetched accounts to delete: ${JSON.stringify(accounts)}`)
        for (const account of accounts) {
            await dynamoDBHelper.deleteObject<Account>({
                Key: {
                    "id": {
                        S: account.id
                    }
                },
                ReturnValues: "NONE",
                TableName: tableForType['Account']
            })
        }
    }
}