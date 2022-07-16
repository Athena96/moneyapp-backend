import { AccountDataAccess } from '../../utilities/AccountDataAccess';
import { AssetDataAccess } from '../../utilities/AssetDataAccess';
import { BudgetDataAccess } from '../../utilities/BudgetDataAccess';
import { BND_MEAN, BND_VARIANCE, FEES, INFLATION, STEPS, VTI_MEAN, VTI_VARIANCE } from '../../utilities/constants';
import { DynamoDBHelper } from '../../utilities/DynamoDBHelper';
import { EventDataAccess } from '../../utilities/EventDataAccess';
import { ComputedAsset, FinnHubClientHelper } from '../../utilities/FinnHubClientHelper';
import { InputDataAccess } from '../../utilities/InputDataAccess';
import { MonteCarloInputs, RowData } from '../../utilities/MonteCarlo';
import { formatRowData, getAvgOfAllScenarios, getRepresentativeScenario, dateRange, getSuccessPercent, MyWorkerDataType } from '../../utilities/helpers';
import { SimulationDataAccess } from '../../utilities/SimulationDataAccess';
import { SimulationStatus } from '../../models/SimulationTypes';
import { PostEvent } from './postManager';
import { BalanceData } from '../../models/MonteCarloTypes';
import { Worker } from 'worker_threads';
import { createWorker } from '../../utilities/helpers';
import { promises } from 'dns';

export const runSimulation = async (event: PostEvent, dynamoDBHelper: DynamoDBHelper, finnhubClient: any): Promise<string | void> => {
    // let users: UserType[] = [];
    // try {
    //     users = await cognitoHelper.getUsersInPool(COGNITO_POOL_ID)
    // } catch (e) {
    //     throw new Error('could not get users.')
    // }

    // {
    //     email: inputEmail,
    //     postCommand: inputCommand
    // }

    const email = event.email!;

    const start = new Date();

    // for (const user of users) {
        // 1. pull events, budgets, inputs, accounts, startDt, endDt, dateim59, retireDate
        let monteCarloInputs: MonteCarloInputs | null = null;
        try {
            // const email = cognitoHelper.getEmail(user);
            // if (userCalledEmail && email !== userCalledEmail)
                // continue;
            console.log('Running Simulation For: ' + email);
            console.log('set Simulation as RUNNING');
            await SimulationDataAccess.markSimulationAsRunning(dynamoDBHelper, email);

            const simulation = await SimulationDataAccess.fetchSelectedSimulationForUser(dynamoDBHelper, email);
            if (simulation === null) {
                console.log('no simulation for user, going to next user');
                return
            }
            const accounts = await AccountDataAccess.fetchAccounts(dynamoDBHelper, simulation.id);
            if (accounts === null || accounts.length === 0) {
                console.log('no accounts for user, going to next user');
                return;
            }
            const budgets = await BudgetDataAccess.fetchBudgets(dynamoDBHelper, simulation.id);
            if (budgets === null || budgets.length === 0) {
                console.log('no budgets for user, going to next user');
                return;
            }
            const events = await EventDataAccess.fetchEvents(dynamoDBHelper, simulation.id);
            const input = await InputDataAccess.fetchInputs(dynamoDBHelper, simulation.id);
            const assets = await AssetDataAccess.fetchAssets(dynamoDBHelper, simulation.id);

            monteCarloInputs = { accounts, budgets, events, input, assets, simulation }
        } catch (e) {
            console.error(e)
        }

        if (monteCarloInputs) {

            // 2. fetch stock data for my assets
            let computedAssets: ComputedAsset[] = [];
            try {
                for (const asset of monteCarloInputs.assets) {
                    const stockPrice = await FinnHubClientHelper.computeAsset(asset, finnhubClient);
                    const price = asset.hasIndexData ? Number((stockPrice * asset.quantity).toFixed(2)) : asset.quantity;
                    computedAssets.push({ asset, price });
                }
            } catch (e) {
                console.error(e)
            }

            // 3. compute starting balance
            const startDate = new Date();
            const balances: BalanceData = {};
            for (const account of monteCarloInputs.accounts) {
                const startingBal = computedAssets.map((computedAsset: ComputedAsset) => {
                    if (computedAsset.asset.account === account.name) {
                        return computedAsset.price;
                    } else {
                        return 0;
                    }
                }).reduce((prev, curr) => prev + curr, 0);
                console.log(`${account.name} - $${startingBal.toFixed(2)}`)
                balances[account.id] = [startingBal];
            }

            // 4. simulate for 1K steps
            const endDate = new Date(monteCarloInputs.input.birthday);
            endDate.setFullYear(endDate.getFullYear() + 100);

            console.log('allocations: ' + JSON.stringify(monteCarloInputs.input.assetAllocation))

            const dates = dateRange(startDate, endDate);
            // const simulations = simulate(
            //     monteCarloInputs,
            //     balances,
            //     dates,
            //     STEPS,
            //     (VTI_MEAN - (INFLATION + FEES)),
            //     (BND_MEAN - (INFLATION + FEES)),
            //     VTI_VARIANCE,
            //     BND_VARIANCE);

            const vtiMean = (VTI_MEAN - (INFLATION + FEES))
            const bndMean = (VTI_MEAN - (INFLATION + FEES))
            const steps = STEPS/8;
            const MyWorkerData: MyWorkerDataType = {
                monteCarloInputs,
                balances,
                dates,
                steps,
                vtiMean,
                bndMean,
                VTI_VARIANCE,
                BND_VARIANCE
            }

            
            const workers = []
            const workerPromise1 = createWorker(1,MyWorkerData)
            const workerPromise2 = createWorker(2,MyWorkerData)
            const workerPromise3 = createWorker(3,MyWorkerData)
            const workerPromise4 = createWorker(4,MyWorkerData)
            const workerPromise5 = createWorker(5,MyWorkerData)
            const workerPromise6 = createWorker(6,MyWorkerData)
            const workerPromise7 = createWorker(7,MyWorkerData)
            const workerPromise8 = createWorker(8,MyWorkerData)
            workers.push(workerPromise1)
            workers.push(workerPromise2)
            workers.push(workerPromise3)
            workers.push(workerPromise4)
            workers.push(workerPromise5)
            workers.push(workerPromise6)
            workers.push(workerPromise7)
            workers.push(workerPromise8)

            console.log('started workers wating...');
            let thread1Res: any;
            let thread2Res: any;
            let thread3Res: any;
            let thread4Res: any;
            let thread5Res: any;
            let thread6Res: any;
            let thread7Res: any;
            let thread8Res: any;
            try {
                const d = await Promise.all(workers);
                console.log('done! all threads');

                 thread1Res = d["0"] as any;
                 thread2Res = d["1"] as any;
                 thread3Res = d["2"] as any;
                 thread4Res = d["3"] as any;

                 thread5Res = d["4"] as any;
                 thread6Res = d["5"] as any;
                 thread7Res = d["6"] as any;
                 thread8Res = d["7"] as any;         

            } catch( e) {
                console.log(e)
            }
            const res1 = thread1Res["value"] as RowData[][];
            const res2 = thread2Res["value"] as RowData[][];
            const res3 = thread3Res["value"] as RowData[][];
            const res4 = thread4Res["value"] as RowData[][];
            const res5 = thread1Res["value"] as RowData[][];
            const res6 = thread2Res["value"] as RowData[][];
            const res7 = thread3Res["value"] as RowData[][];
            const res8 = thread4Res["value"] as RowData[][];
            const simulations = res1
            .concat(res2)
            .concat(res3)
            .concat(res4)
            .concat(res5)
            .concat(res6)
            .concat(res7)
            .concat(res8)

            console.log('simulations ' + simulations.length)
            // 5. calculate success percent from simulations
            const successPercent = getSuccessPercent(simulations);
            console.log('successPercent: ' + successPercent);

            // 6. calcultate max, min, avg, assumedAvg from simulations.
            // const maxScenario = getMaxScenario(simulations)
            // const minScenario = getMinScenario(simulations)
            const avgOfAllScenarios = getAvgOfAllScenarios(simulations)
            // const assumedAvgScenario = getAssumedAvgScenario(
            //     monteCarloInputs,
            //     balances,
            //     dates,
            //     dateIm59,
            //     ((VTI_MEAN - INFLATION) / 100.0 / 12.0),
            //     ((BND_MEAN - INFLATION) / 100.0 / 12.0));

            const representativeScenario = getRepresentativeScenario(avgOfAllScenarios, simulations);
            const formattedData = formatRowData(representativeScenario)
            // const aggregatedStats = joinScenarios(maxScenario, minScenario, avgOfAllScenarios, assumedAvgScenario);

            // 7. update DDB
            try {
                await SimulationDataAccess.updateSimulation(
                    dynamoDBHelper,
                    monteCarloInputs.simulation,
                    new Date(),
                    successPercent,
                    SimulationStatus.Done,
                    formattedData);
            } catch (e) {
                console.error(e)
            }

            console.log('DONE');
        }

    // }
    const end = new Date();

    console.log(`${(end.getTime()-start.getTime())/1000.0}`)

        return "done"

};
