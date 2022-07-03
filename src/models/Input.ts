
import { AssetAllocation } from "./AssetAllocation";
import { Key } from "./KeyInterface";

export class Input implements Key {
    id: string;
    birthday: Date;
    firstSignIn: boolean;
    assetAllocation: AssetAllocation;
    simulation: string;

    constructor(id: string, 
        birthday: Date,
        firstSignIn: boolean,
        assetAllocation: AssetAllocation,
        simulation: string) {
            this.id = id;
            this.birthday = birthday;
            this.firstSignIn = firstSignIn;
            this.assetAllocation = assetAllocation;
            this.simulation = simulation;
    }

    getKey() {
        return this.id;
    }
}