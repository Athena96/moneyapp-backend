
import { Key } from "./KeyInterface";
import { Event } from './Event';
import { Category } from './Category';
import { SimulationStatus } from "./SimulationTypes";

export class Simulation implements Key {

    id: string;
    name: string;
    selected: number;
    simulationData: string;
    successPercent: string;
    lastComputed: Date;
    user: string;
    status: SimulationStatus;

    constructor(id: string, name: string, selected: number, successPercent: string, simulationData: string, lastComputed: Date, user: string, status: SimulationStatus) {
        this.id = id;
        this.name = name;
        this.selected = selected;
        this.simulationData = simulationData;
        this.successPercent = successPercent;
        this.lastComputed = lastComputed;
        this.user = user;
        this.status = status;
    }

    getKey() {
        return this.id;
    }

}

