import { Key } from "./KeyInterface";
import { CategoryTypes } from "./CategoryTypes";

export class Category implements Key {
    id: string;
    name: string;
    value: number;

    constructor(id: string, name: string, value: number) {
        this.id = id;
        this.name = name;
        this.value = value;
    }

     getValue() {
        return this.value;
    }


    getCategoryDescription() {
        return `[Category] name: ${this.name} value: ${this.value}`;
    }

    getKey() {
        return this.id;
    }
}

