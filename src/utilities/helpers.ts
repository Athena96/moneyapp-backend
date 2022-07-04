import { Account } from "../models/Account";
import { Budget } from "../models/Budget";
import { Event } from "../models/Event";
import { MonteCarloRowData, RowData } from "./MonteCarlo";

export function getCognitoPoolId(): string {
    if (process.env.POOL_ID) {
        return process.env.POOL_ID
    } else {
        throw new Error('Failed to get env var POOL_ID')
    }
}

export function dateRange(startDate: Date, endDate: Date, steps = 31): Date[] {
    const dateArray: Date[] = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1);

    while (currentDate <= new Date(endDate)) {
        dateArray.push(new Date(currentDate));
        var month = currentDate.getMonth() + 1; // increment the month
        var year = month === 0 ? currentDate.getFullYear() + 1 : currentDate.getFullYear(); // if it incremented to January, then increment the year.
        currentDate = new Date(year, month, 1);
    }

    return dateArray;
}

export function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

export function endedSuccessFully(results: RowData[]) {
    const taxEndingBal = results[results.length - 1].taxBal.replace('$', '');
    const brokerageEndingBal = results[results.length - 1].brokerageBal.replace('$', '');
    const winLose = parseInt(taxEndingBal) > 0 || parseInt(brokerageEndingBal) > 0;
    console.log(`${winLose ? 'win' : 'LOSE'} taxEndingBal: ${taxEndingBal}  brokerageEndingBal: ${brokerageEndingBal}`);
    return winLose
}

export function getSuccessPercent(simulations: RowData[][]) {
    let numSuccess = 0.0;
    for (const simulation of simulations) {
        if (endedSuccessFully(simulation)) {
            numSuccess += 1;
        }
    }

    return ((numSuccess / simulations.length) * 100);
}

export function getBrokerageAccountWithSmallestNonZeroBalance(accounts: Account[], currentDateIndex: number, balances: any) {

    let idxSmallest = 0;
    let smallestBal = null;
    let i = 0;
    for (const account of accounts) {
        if (account.taxAdvantaged === 0) {
            if (smallestBal === null) {
                smallestBal = balances[account.id][(currentDateIndex - 1).toString()];
            }
            const bal: number = balances[account.id][(currentDateIndex - 1).toString()];
            if (bal > 0 && bal <= smallestBal) {
                smallestBal = bal;
                idxSmallest = i;
            }

        }
        i += 1;
    }

    return accounts[idxSmallest];
}

export function getTaxAccountWithSmallestNonZeroBalance(accounts: Account[], currentDateIndex: number, balances: any) {
    let idxSmallest = 0;
    let smallestBal = null;
    let i = 0;
    for (const account of accounts) {
        if (account.taxAdvantaged === 1) {
            if (smallestBal === null) {
                smallestBal = balances[account.id][(currentDateIndex - 1).toString()];
            }
            const bal: number = balances[account.id][(currentDateIndex - 1).toString()];
            if (bal > 0 && bal <= smallestBal) {
                smallestBal = bal;
                idxSmallest = i;
            }

        }
        i += 1;
    }
    return accounts[idxSmallest]
}

export function isMoneyInAnyTaxAccounts(accounts: Account[], currentDateIndex: number, balances: any) {
    for (const account of accounts) {
        if (account.taxAdvantaged === 1) {
            if (balances[account.id][(currentDateIndex - 1).toString()] > 0) {
                return true;
            }
        }
    }
    return false;
}

export function getMaxScenario(simulations: RowData[][]) {
    let maxBal = 0;
    let maxBalIndex = 0;
    let i = 0;
    for (const simulation of simulations) {
        const endingBal = parseInt(simulation[simulation.length - 1].brokerageBal.replace('$', ''))
        if (endingBal > maxBal) {
            maxBalIndex = i;
            maxBal = endingBal;
        }
        i += 1;
    }

    return simulations[maxBalIndex];
}

export function getMinScenario(simulations: RowData[][]) {

    let minBal = 0;
    let minBalIndex = 0;
    let i = 0;
    for (const simulation of simulations) {
        const endingBal = parseInt(simulation[simulation.length - 1].brokerageBal.replace('$', ''))
        if (i === 0) {
            minBal = endingBal;
        }
        if (endingBal < minBal) {
            minBalIndex = i;
            minBal = endingBal;
        }

        i += 1;
    }
    return simulations[minBalIndex];

}

export function getRepresentativeScenario(avgOfAllScenarios: RowData[], simulations: RowData[][]) {
    const endingBal = parseInt(avgOfAllScenarios[avgOfAllScenarios.length - 1].sum.replace('$', ''));
    let minDelta = Number.MAX_VALUE;
    let idxOfMin = 0;
    let i = 0;
    for (const simulation of simulations) {
        const simEndingBal = parseInt(simulation[simulation.length - 1].sum.replace('$', ''));
        const currDiff = Math.abs(endingBal - simEndingBal);
        if (currDiff < minDelta) {
            minDelta = currDiff;
            idxOfMin = i;
        }
        i += 1;
    }
    return simulations[idxOfMin];
}

export function getAvgOfAllScenarios(simulations: RowData[][]) {

    // get average of all simulations
    let newSim: RowData[] = []
    for (let colIdx = 0; colIdx < simulations[0].length; colIdx += 1) {
        let brokerageBalSum = 0.0;
        let taxBalSum = 0.0;
        let returnSum = 0.0;
        let dt = simulations[0][colIdx].date
        let accountUsed = ""
        let note = ""
        let events: Event[] = []
        for (const simulation of simulations) {
            brokerageBalSum += parseFloat(simulation[colIdx].brokerageBal.replace('$', ''));
            taxBalSum += parseFloat(simulation[colIdx].taxBal.replace('$', ''));
            returnSum += parseFloat(simulation[colIdx].return);
            accountUsed = simulation[colIdx].accountUsed;
            note = simulation[colIdx].note;
            events = simulation[colIdx].events || [];
        }
        const brokerageAvg = brokerageBalSum / simulations.length
        const taxAvg = taxBalSum / simulations.length
        const returnAvg = returnSum / simulations.length
        const sum = brokerageAvg + taxAvg;
        newSim.push({
            date: dt,
            brokerageBal: `$${brokerageAvg.toFixed(2)}`,
            taxBal: `$${taxAvg.toFixed(2)}`,
            sum: `$${sum.toFixed(2)}`,
            note: note,
            return: returnAvg.toFixed(2) + "",
            accountUsed: accountUsed,
            events: events
        })
    }
    return newSim;
}

export function formatRowData(simulation: RowData[]) {
    let formatedSim: MonteCarloRowData[] = []
    for (let i = 0; i < simulation.length; i += 1) {
        formatedSim.push({
            date: simulation[i].date,
            return: simulation[i].return,
            events: simulation[i].events,
            note: simulation[i].note,
            accountUsed: simulation[i].accountUsed,
            assumedAvgBalanceBrok: simulation[i].brokerageBal,
            avgBalance: simulation[i].sum,
            assumedAvgBalanceTax: simulation[i].taxBal,
            incomeExpenses: simulation[i].incomeExpenses
        })
    }
    return formatedSim;
}

export function getActiveBudgets(date: Date, budgets: Budget[]) {
    let currentBudgets: Budget[] = [];
    date.setHours(0, 0, 0);
    for (const budget of budgets) {
        if (date >= new Date(budget.startDate.setHours(0, 0, 0)) && date <= new Date(budget.endDate.setHours(0, 0, 0))) {
            currentBudgets.push(budget);
        }
    }
    return currentBudgets;
}

export function getActiveEvents(date: Date, account: Account, events: Event[]) {
    let activeEvents: Event[] = []
    for (const event of events) {
        if (event.account === account.name) {
            if (event.date.getMonth() === date.getMonth() &&
                event.date.getFullYear() === date.getFullYear()) {
                activeEvents.push(event);
            }
        }
    }
    return activeEvents;
}