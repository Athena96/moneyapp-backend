import { AccountDataAccess } from '../../utilities/AccountDataAccess';
import { AssetDataAccess } from '../../utilities/AssetDataAccess';
import { BudgetDataAccess } from '../../utilities/BudgetDataAccess';
import { BND_MEAN, BND_VARIANCE, FEES, INFLATION, STEPS, VTI_MEAN, VTI_VARIANCE } from '../../utilities/constants';
import { DynamoDBHelper } from '../../utilities/DynamoDBHelper';
import { EventDataAccess } from '../../utilities/EventDataAccess';
import { ComputedAsset, FinnHubClientHelper } from '../../utilities/FinnHubClientHelper';
import { InputDataAccess } from '../../utilities/InputDataAccess';
import { MonteCarloInputs, simulate } from '../../utilities/MonteCarlo';
import { formatRowData, getAvgOfAllScenarios, getRepresentativeScenario, dateRange, getSuccessPercent } from '../../utilities/helpers';
import { SimulationDataAccess } from '../../utilities/SimulationDataAccess';
import { SimulationStatus } from '../../models/SimulationTypes';
import { PostEvent } from './postManager';
import { BalanceData } from '../../models/MonteCarloTypes';

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

    try {

        // for (const user of users) {
        // 1. pull events, budgets, inputs, accounts, startDt, endDt, dateim59, retireDate
        let monteCarloInputs: MonteCarloInputs | null = null;

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


        if (monteCarloInputs) {

            // 2. fetch stock data for my assets
            let computedAssets: ComputedAsset[] = [];
            for (const asset of monteCarloInputs.assets) {
                if (asset.hasIndexData === 1) {
                    let assetPrice: number;
                    try {
                        assetPrice = await FinnHubClientHelper.computeAsset(asset, finnhubClient);
                    } catch (e) {
                        assetPrice = 0.0;
                        console.error(e)
                    }
                    const totalEquityValue = Number((assetPrice * asset.quantity).toFixed(2))
                    computedAssets.push({ asset, price: totalEquityValue });
                } else {
                    computedAssets.push({ asset, price: asset.quantity });
                }
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
            console.log('accounts: ' + JSON.stringify(monteCarloInputs.accounts))

            const dates = dateRange(startDate, endDate);
            const simulations = simulate(
                monteCarloInputs,
                balances,
                dates,
                STEPS,
                (VTI_MEAN - (INFLATION + FEES)),
                (BND_MEAN - (INFLATION + FEES)),
                VTI_VARIANCE,
                BND_VARIANCE);

            console.log('simulations: ' + simulations.length)

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
            await SimulationDataAccess.updateSimulation(
                dynamoDBHelper,
                monteCarloInputs.simulation,
                new Date(),
                successPercent,
                SimulationStatus.Done,
                formattedData);

            console.log('DONE');
        }
    } catch (e) {
        console.error(e);
        await SimulationDataAccess.markSimulationAsDone(dynamoDBHelper, email);
    }

    // }

    return "done"
};
