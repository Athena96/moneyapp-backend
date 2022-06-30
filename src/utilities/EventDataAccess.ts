
import { Event } from '../models/Event';
import { DynamoDB } from 'aws-sdk';
import { DynamoDBHelper } from './DynamoDBHelper';
import { Category } from '../models/Category';
import { CategoryTypes } from '../models/CategoryTypes';


export class EventDataAccess {

    static eventsMapperFunction(input: DynamoDB.AttributeMap) {
        const id = input['id'].S || ""
        const name = input['name'].S || ""
        const date = new Date(input['date'].S || "")
        const account = input['account'].S || ""
        const categorieMap = input['category'].M || {}
        const type = input['type'] && input['type'].S === "Income" ?  CategoryTypes.Income : CategoryTypes.Expense;
        return new Event(id, name, date, account, new Category(categorieMap['id'].S || "", categorieMap['name'].S || "", Number(categorieMap['value'].N || "0.0")), type);
    }

    static async fetchEvents(dynamoDBHelper: DynamoDBHelper, simulationId: string) {
        let fetchedEvents: Event[] = [];
        fetchedEvents = await dynamoDBHelper.fetchAllOf<Event>('Event', this.eventsMapperFunction, simulationId);
        return fetchedEvents;
    }

}