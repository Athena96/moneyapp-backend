import { Key } from './KeyInterface';

export class Account implements Key {
    id: string;
    name: string;
    taxAdvantaged: number;
    contributionPercent: number;

    constructor(id: string, name: string, taxAdvantaged: number, contributionPercent: number = 0.0) {
        this.id = id;
        this.name = name;
        this.taxAdvantaged = taxAdvantaged;
        this.contributionPercent = contributionPercent;
    }

    getKey() {
        return this.id;
    }
}
