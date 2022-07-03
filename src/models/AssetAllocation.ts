
import { Allocations } from "./Allocations";

export enum GlidePath {
    Evenly = "Evenly",
    Quickly = "Quickly",
    Slowly = "Slowly",
}

export class AssetAllocation {
    startAllocations: Allocations
    endAllocations: Allocations | undefined;
    glidePath: GlidePath | undefined;

    constructor(startAllocations: Allocations, endAllocations: Allocations | undefined, glidePath: GlidePath | undefined) {
        this.startAllocations = startAllocations;
        this.endAllocations = endAllocations;
        this.glidePath = glidePath;
    }
}

