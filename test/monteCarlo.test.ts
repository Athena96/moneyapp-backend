import { Account } from "../src/models/Account";
import { Allocations } from "../src/models/Allocations";
import { Asset } from "../src/models/Asset";
import { AssetAllocation } from "../src/models/AssetAllocation";
import { Budget } from "../src/models/Budget";
import { Category } from "../src/models/Category";
import { CategoryTypes } from "../src/models/CategoryTypes";
import { Event } from "../src/models/Event";
import { Input } from "../src/models/Input";
import { BalanceData } from "../src/models/MonteCarloTypes";
import { Simulation } from "../src/models/Simulation";
import { SimulationStatus } from "../src/models/SimulationTypes";
import { dateRange, getActiveBudgets, getBudgetsSpendingOfType } from "../src/utilities/helpers";
import { MonteCarloInputs, projectWithReturn } from "../src/utilities/MonteCarlo";
import { INCOME_EXPENSE_DELTAS, GROWTH_RATES} from "./testData/testDataExports"

describe('Helpers tests', function () {

    
    let accounts: Account[] = []
    let tax1 = new Account('1', 'tax1', 1, 10);
    let brok1 = new Account('2', 'brok1', 0, 90);

    let currentDateIndex = 1;

    let balances: BalanceData = {}

    accounts.push(tax1)
    accounts.push(brok1)

    balances[tax1.id] = [20000]
    balances[brok1.id] = [150000]


    it('test projectWithReturn Happy Case no glide path', async () => {
        const sim = new Simulation('1', '', 1, '', '', new Date(), '', SimulationStatus.Running);

        const inputs: MonteCarloInputs = {
            accounts: accounts,
            input: new Input('1', new Date(1996, 5, 25), false, new AssetAllocation(new Allocations('80', '15', '5'), undefined, undefined), sim.id),
            assets: [
                new Asset('', '', 1, 1, '', 0)
            ],
            simulation: sim,
            budgets: [
                new Budget('1', 'budeget', new Date(2022, 7, 1), new Date(2096, 4, 25), [new Category('', 'exp', 5830)], CategoryTypes.Expense),
                new Budget('2', 'incomes', new Date(2022, 7, 1), new Date(2031, 4, 25), [new Category('', 'income', 10500)], CategoryTypes.Income),

            ],
            events: [
                new Event('1', 'event', new Date(2030, 5, 1), brok1.name, new Category('', 'income', 100), CategoryTypes.Income),
                new Event('2', 'event', new Date(2031, 5, 1), brok1.name, new Category('', 'expense', 80000), CategoryTypes.Expense)
            ]
        }
        const dateIm59 = new Date(inputs.input.birthday);
        dateIm59.setFullYear(dateIm59.getFullYear() + 59);

        const dates = dateRange(new Date(2022, 7, 1), new Date(2096, 4, 25));


        expect(GROWTH_RATES.length).toEqual(dates.length);
        expect(INCOME_EXPENSE_DELTAS.length).toEqual(dates.length);
        const res = projectWithReturn(balances, inputs, dateIm59, dates, GROWTH_RATES, INCOME_EXPENSE_DELTAS);
        const last = res[res.length - 1];
        const expected = {
            "date": new Date("2096-05-01T07:00:00.000Z"),
            "brokerageBal": "6800611.69",
            "taxBal": "0.00",
            "sum": "6800611.69",
            "return": "1.50",
            "note": "",
            "accountUsed": "brok1",
            "events": [],
            "incomeExpenses": "-5830.00"
        };

        expect(last).toEqual(expected)

    });

});