
import { Budget } from '../models/Budget';
import { DynamoDB } from 'aws-sdk';
import { DynamoDBHelper } from './DynamoDBHelper';
import { Category } from '../models/Category';
import { CategoryTypes } from '../models/CategoryTypes';


export class BudgetDataAccess {

    static budgetsMapperFunction(input: DynamoDB.AttributeMap) {
        const id = input['id'].S || ""
        const name = input['name'].S || ""
        const startDate = new Date(input['startDate'].S || "")
        const endDate = new Date(input['endDate'].S || "")
        const categories = input['categories'].L || []
        const type = input['type'] && input['type'].S === "Income" ?  CategoryTypes.Income : CategoryTypes.Expense;
        let cats: Category[] = []
        for (const c of categories) {
            const catMap = c.M || {};
            cats.push(new Category('', catMap['name'].S || "", Number(catMap['value'].N || 0.0)));
        }
        
        return new Budget(id, name, startDate, endDate, cats, type);
    }

    static async fetchBudgets(dynamoDBHelper: DynamoDBHelper, simulationId: string) {
        let fetchedBudgets: Budget[] = [];
        fetchedBudgets = await dynamoDBHelper.fetchAllOf<Budget>('Budget', this.budgetsMapperFunction, simulationId);
        return fetchedBudgets;
    }

}