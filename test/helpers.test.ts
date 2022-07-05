import { Account } from "../src/models/Account";
import { BalanceData } from "../src/models/MonteCarloTypes";
import { getAccountWithSmallestNonZeroBalance } from "../src/utilities/helpers";



describe('Helpers tests', function () {

    let accounts: Account[] = []
    let tax1 = new Account('1','tax1',1,5);
    let tax2 = new Account('2','tax2',1,5);
    let brok1 = new Account('3','brok1',0,45);
    let brok2 = new Account('4','brok2',0,45);
  
    let currentDateIndex = 1;

    let balances: BalanceData = {}

    beforeEach(() => {
        accounts = []
        accounts.push(tax1)
        accounts.push(tax2)
        accounts.push(brok1)
        accounts.push(brok2)

        balances[tax1.id] = [100]
        balances[tax2.id] = [150]
        balances[brok1.id] = [200]
        balances[brok2.id] = [250]
    })

    it('test Brok getAccountWithSmallestNonZeroBalance Happy Case', async () => {
        const acnt: Account = getAccountWithSmallestNonZeroBalance(accounts, currentDateIndex, balances, 0);
        expect(acnt.id).toEqual(brok1.id)
    });

    it('test Brok getAccountWithSmallestNonZeroBalance Zero', async () => {
        balances[brok1.id] = [0]
        balances[brok2.id] = [250]
        const acnt: Account = getAccountWithSmallestNonZeroBalance(accounts, currentDateIndex, balances, 0);
        expect(acnt.id).toEqual(brok2.id)
    });

    it('test Brok getAccountWithSmallestNonZeroBalance Neg', async () => {
        balances[brok1.id] = [-100]
        balances[brok2.id] = [250]
        const acnt: Account = getAccountWithSmallestNonZeroBalance(accounts, currentDateIndex, balances, 0);
        expect(acnt.id).toEqual(brok2.id)
    });

    it('test Tax getAccountWithSmallestNonZeroBalance Happy Case', async () => {
        const acnt: Account = getAccountWithSmallestNonZeroBalance(accounts, currentDateIndex, balances, 1);
        expect(acnt.id).toEqual(tax1.id)
    });

    it('test Tax getAccountWithSmallestNonZeroBalance Zero', async () => {
        balances[tax1.id] = [0]
        balances[tax2.id] = [150]
        const acnt: Account = getAccountWithSmallestNonZeroBalance(accounts, currentDateIndex, balances, 1);
        expect(acnt.id).toEqual(tax2.id)
    });

    it('test Tax getAccountWithSmallestNonZeroBalance Neg', async () => {
        balances[tax1.id] = [-100]
        balances[tax2.id] = [150]
        const acnt: Account = getAccountWithSmallestNonZeroBalance(accounts, currentDateIndex, balances, 1);
        expect(acnt.id).toEqual(tax2.id)
    });



    it('test endedSuccessFully Happy Case', async () => {
        // endedSuccessFully
    });

    it('test getSuccessPercent Happy Case', async () => {
        // getSuccessPercent
    });

    it('test isMoneyInAnyTaxAccounts Happy Case', async () => {
        // isMoneyInAnyTaxAccounts
    });

    it('test getMaxScenario Happy Case', async () => {
        // getMaxScenario
    });

    it('test getMinScenario Happy Case', async () => {
        // getMinScenario
    });


    it('test getActiveBudgets Happy Case', async () => {
        // getActiveBudgets
    });

    it('test getActiveEvents Happy Case', async () => {
        // getActiveEvents
    });

});