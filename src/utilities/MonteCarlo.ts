import { Account } from "../models/Account";
import { Budget } from "../models/Budget";
import { Event } from "../models/Event";
import { CategoryTypes } from "../models/CategoryTypes";
import { Input } from "../models/Input";
import { Asset } from "../models/Asset";
import { Simulation } from "../models/Simulation";
import {
    getActiveBudgets,
    getActiveEvents,
    getAccountWithSmallestNonZeroBalance,
    isMoneyInAnyTaxAccounts,
    shuffleArray,
    getBudgetsSpendingOfType
} from "./helpers";
import { BalanceData } from "../models/MonteCarloTypes";

export type MonteCarloInputs = {
    accounts: Account[],
    input: Input,
    assets: Asset[],
    simulation: Simulation,
    budgets?: Budget[],
    events?: Event[],
}

export interface RowData {
    date: Date;
    brokerageBal: string;
    taxBal: string;
    sum: string;
    note: string;
    return: string;
    accountUsed: string;
    events?: Event[];
    incomeExpenses?: string;
}

export interface MonteCarloRowData {
    date: Date;
    maxBalance?: string;
    avgBalance?: string;
    assumedAvgBalance?: string;
    minBalance?: string;
    return: string;
    accountUsed: string;
    note: string;
    events?: Event[];
    assumedAvgBalanceBrok: string;
    assumedAvgBalanceTax: string;
    incomeExpenses?: string;
}

export function getNormalDistributionOfReturns(size: number, mean: number, variance: number) {
    const gaussian = require('gaussian');
    const distribution = gaussian(mean, variance);
    let sample = distribution.random(size);
    return shuffleArray<number>(sample);
}

export function simulate(
    monteCarloInputs: MonteCarloInputs,
    balances: BalanceData,
    dates: Date[],
    steps: number,
    vtiMean: number,
    bondMean: number,
    vtiVariance: number,
    bondVariance: number) {


    const startAllocations = monteCarloInputs.input.assetAllocation.startAllocations;
    const startStocks = parseFloat(startAllocations.equities) / 100.0;
    const startBonds = parseFloat(startAllocations.bonds) / 100.0;
    const startCash = parseFloat(startAllocations.cash) / 100.0;

    // #todo noany
    // let assetAllocationOverTime: any[] | null = null;


    // if (monteCarloInputs.input.assetAllocation.endAllocations) {
    //     assetAllocationOverTime = [];
    //     const endAllocations = monteCarloInputs.input.assetAllocation.endAllocations;
    //     const endStocks = parseFloat(endAllocations.equities) / 100.0;
    //     const endBonds = parseFloat(endAllocations.bonds) / 100.0;
    //     const endCash = parseFloat(endAllocations.cash) / 100.0;
    
    
    //     assetAllocationOverTime.push({
    //         'stock': startStocks,     
    //         'bond': startBonds,
    //         'cash': startCash
    //     })
    //     const totalSteps = (dates.length)
    //     for (let step = 1; step < totalSteps; step += 1) {
    //         const stockDiff = (startStocks - endStocks) / (totalSteps);
    //         const bondDiff = (startBonds - endBonds) / (totalSteps);
    //         const cashDiff = (startCash - endCash) / (totalSteps);
            
    //         // #noany
    //         const prev: any = assetAllocationOverTime[step-1];
    //         assetAllocationOverTime.push({
    //             'stock': prev['stock'] - stockDiff,           
    //             'bond': prev['bond'] - bondDiff,
    //             'cash': prev['cash'] - cashDiff
    //         });
    //     }
    // }

    const dateIm59 = new Date(monteCarloInputs.input.birthday);
    dateIm59.setFullYear(dateIm59.getFullYear() + 59);
    const setOfSimulations: RowData[][] = [];
    for (let i = 0; i < steps; i += 1) {
        const newBalData: BalanceData = {}
        for (const k of Object.keys(balances)) {
            newBalData[k] = [...balances[k]]
        }

        let distributionOfReturns: number[] = []
        // if (assetAllocationOverTime) {
        //     for (let j = 0; j < assetAllocationOverTime.length; j += 1) {
        //         const stocks = assetAllocationOverTime[j]['stock'];
        //         const bonds = assetAllocationOverTime[j]['bond'];
        //         const cash = assetAllocationOverTime[j]['cash'];
        //         const mixVariance = stocks * vtiVariance + bonds * bondVariance + cash * 0;
        //         const mixMean = stocks * vtiMean + bonds * bondMean + cash * 0;
        //         let currDistro = getNormalDistributionOfReturns(dates.length, mixMean, mixVariance).map((o) => {
        //                 return o / 12.0 / 100.0
        //         });
        //         distributionOfReturns.push(currDistro[i]);
        //     }

        // } else {
            const mixVariance = startStocks * vtiVariance + startBonds * bondVariance + startCash * 0;
            const mixMean = startStocks * vtiMean + startBonds * bondMean + startCash * 0;
            distributionOfReturns = getNormalDistributionOfReturns(dates.length, mixMean, mixVariance).map((o) => {
                    return o / 12.0 / 100.0
                });
        // }


        // let distributionOfReturns = getNormalDistributionOfReturns(dates.length, mixMean, mixVariance).map((o) => {
        //     return o / 12.0 / 100.0
        // });
        const budgets = monteCarloInputs.budgets || [];
        const incomeExpenseDeltaData: number[] = []
        for (let i = 0; i < dates.length; i += 1) {
            const date = dates[i];
            const currentBudgets = getActiveBudgets(date, budgets || [])
            const monthlySpending = getBudgetsSpendingOfType(currentBudgets, CategoryTypes.Expense);
            const monthlyIncome = getBudgetsSpendingOfType(currentBudgets, CategoryTypes.Income);
            const incomeExpenseDelta = monthlyIncome - monthlySpending;
            incomeExpenseDeltaData.push(incomeExpenseDelta);
        }


        setOfSimulations.push(projectWithReturn(
            newBalData,
            monteCarloInputs,
            dateIm59,
            dates,
            distributionOfReturns,
            incomeExpenseDeltaData));
    }

    return setOfSimulations;
}

export function projectWithReturn(balances: BalanceData, monteCarloInputs: MonteCarloInputs, dateIm59: Date, dates: Date[], growRates: number[], incomeExpenseDeltaData: number[]) {
    const events = monteCarloInputs.events || [];
    // const budgets = monteCarloInputs.budgets || [];
    const accounts = monteCarloInputs.accounts;

    let data: RowData[] = []
    for (let i = 0; i < dates.length; i += 1) {
        const date = dates[i];
        let eventDesc = "";
        let accntUsed = "";
        let finalG = "";
        let eventsApplied = []
        let brokBal = 0.0
        let taxBal = 0.0

        const incomeExpenseDelta: number = incomeExpenseDeltaData[i];
        for (const account of accounts) {
            const growth = growRates[i];
            finalG = (growth * 100).toFixed(2).toString();

            if (i > 0) {
                // grow
                balances[account.id].push(balances[account.id][i-1] > 0 ? balances[account.id][i-1] + growth * balances[account.id][i-1] : 0.0);

                // contribute or use
                if (incomeExpenseDelta > 0) {
                    balances[account.id][i] += ((account.contributionPercent / 100.0) * incomeExpenseDelta)
                } else {
                    if (use(account, accounts, date, i, dateIm59, balances)) {
                        accntUsed = account.name;
                        balances[account.id][i] += incomeExpenseDelta
                    }
                }
            }

            const activeEvents = getActiveEvents(date, account, events);
            for (const event of activeEvents) {
                eventDesc += `${event.name}`;
                eventsApplied.push(event);
                const isExpense = event.type === CategoryTypes.Expense;
                eventDesc += ` ${isExpense ? '-' : '+'}$${event.category.getValue()}`;
                balances[account.id][i] += ((isExpense ? -1 : 1) * event.category.getValue());
                eventDesc += ` | `;
            }

            account.taxAdvantaged === 1 ? taxBal += balances[account.id][i] :  brokBal += balances[account.id][i];
        }

        data.push({
            date: date,
            brokerageBal: `${brokBal.toFixed(2)}`,
            taxBal: `${taxBal.toFixed(2)}`,
            sum: `${(taxBal + brokBal).toFixed(2)}`,
            return: `${finalG}`,
            note: eventDesc,
            accountUsed: accntUsed,
            events: eventsApplied,
            incomeExpenses: `${incomeExpenseDelta.toFixed(2)}`
        });
    }

    return data;
}

// export function getAssumedAvgScenario(
//     monteCarloInputs: MonteCarloInputs,
//     balances: any,
//     dates: Date[],
//     dateIm59: Date,
//     dateToSlowGroth: Date,
//     vtiMean: number,
//     bndMean: number) {
//     let growRates = new Array(dates.length).fill(vtiMean);
//     const mixMean = 0.25*vtiMean + 0.75*bndMean;
//     let slowGrowRates = new Array(dates.length).fill(mixMean);
//     let data = projectWithReturn(
//         balances,
//         monteCarloInputs,
//         dateIm59,
//         dates,
//         dateToSlowGroth,
//         slowGrowRates, growRates);
//     return data;
// }

export function use(account: Account, accounts: Account[], currentDate: Date, currentDateIndex: number, dateIm59: Date, balances: BalanceData) {
    if (currentDate < dateIm59) {
        let currAcnt = getAccountWithSmallestNonZeroBalance(accounts, currentDateIndex, balances, 0);
        if (currAcnt === null) {
            currAcnt = getAccountWithSmallestNonZeroBalance(accounts, currentDateIndex, balances, 1); // could be zero for sake of math.
        }
        return currAcnt.name === account.name;
    } else {
        // use 401k till empty
        if (isMoneyInAnyTaxAccounts(accounts, currentDateIndex, balances)) {
            const acnt = getAccountWithSmallestNonZeroBalance(accounts, currentDateIndex, balances, 1);
            return acnt.name === account.name;
        } else {
            const brokAcnt = getAccountWithSmallestNonZeroBalance(accounts, currentDateIndex, balances, 0);
            return brokAcnt.name === account.name;
        }
    }
}
