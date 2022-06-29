import { Asset } from "../Models/Asset";


export type ComputedAsset = {
    asset: Asset,
    price: number
}

export class FinnHubClientHelper {
    static getFinnhubClient() {
        const finnhub = require('finnhub');
        const api_key = finnhub.ApiClient.instance.authentications['api_key'];
        delete finnhub.ApiClient.instance.defaultHeaders['User-Agent'];
        api_key.apiKey = "c56e8vqad3ibpaik9s20" // Replace this
        return new finnhub.DefaultApi()
    }
    
    static async computeAsset(asset: Asset, finnhubClient: any): Promise<number> {
        if (asset.ticker !== "" && asset.hasIndexData === 1) {
            
            if (asset.isCurrency === 1) {
                return await this.getCrypto(asset,finnhubClient);
            } else {
                return await this.getQuotes(asset,finnhubClient);
            }
        } else {
            return asset.quantity;
        }
    }
    
    static async getCrypto(entry: Asset, finnhubClient: any): Promise < number > {
        return new Promise((resolve, reject) => {
            finnhubClient.cryptoCandles(`BINANCE:${entry.ticker}USDT`, "D", Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60, Math.floor(Date.now() / 1000), (error: any, data: any, response: any) => {
                if (data && data.c && data.c.length >= 2) {
                    const value: number = data.c[1];
                    resolve(value);
                } else {
                    reject('err getCrypto')
                }
            });
        })
    }
    
    static async getQuotes(entry: Asset, finnhubClient: any): Promise < number > {
        return new Promise((resolve, reject) => {
            finnhubClient.quote(entry.ticker, (error: any, data: any, response: any) => {
                if (data && data.c) {
                    const value: number = data.c;
                    resolve(value);
                } else {
                    reject('err getQuotes')
    
                }
            });
        })
    }
    
}

