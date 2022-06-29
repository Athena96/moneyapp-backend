
import { Key } from './KeyInterface';

export class Asset implements Key {
    id: string;
    ticker: string;
    quantity: number;
    strQuantity: string | undefined;
    hasIndexData: number;
    account: string;
    isCurrency: number;

    constructor(
        id: string,
        ticker: string,
        quantity: number,
        hasIndexData: number,
        account: string,
        isCurrency: number,
        ) {
        this.id = id;
        this.ticker = ticker;
        this.quantity = quantity;
        this.hasIndexData = hasIndexData;
        this.account = account;
        this.isCurrency = isCurrency;
    }

    setQuantity(quantity: string) {
        this.strQuantity = quantity;
        this.quantity = Number(parseFloat(quantity).toFixed(10));
    }

    getKey() {
        return this.id;
    }
}
