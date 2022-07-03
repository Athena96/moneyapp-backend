import { AccountDataAccess } from '../utilities/AccountDataAccess';
import { AssetDataAccess } from '../utilities/AssetDataAccess';
import { BudgetDataAccess } from '../utilities/BudgetDataAccess';
import { BND_MEAN, BND_VARIANCE, FEES, INFLATION, STEPS, VTI_MEAN, VTI_VARIANCE } from '../utilities/constants';
import { DynamoDBHelper } from '../utilities/DynamoDBHelper';
import { EventDataAccess } from '../utilities/EventDataAccess';
import { ComputedAsset, FinnHubClientHelper } from '../utilities/FinnHubClientHelper';
import { InputDataAccess } from '../utilities/InputDataAccess';
import { MonteCarloInputs, simulate } from '../utilities/MonteCarlo';
import { formatRowData, getAvgOfAllScenarios, getRepresentativeScenario, dateRange, getSuccessPercent } from '../utilities/helpers';
import { SimulationDataAccess } from '../utilities/SimulationDataAccess';
import { Context } from 'aws-lambda';
import { SimulationStatus } from '../models/SimulationTypes';
import { DynamoDB } from 'aws-sdk';


const ddbClient = new DynamoDB({ region: process.env.AWS_REGION });
const dynamoDBHelper = new DynamoDBHelper(ddbClient);
const finnhubClient = FinnHubClientHelper.getFinnhubClient();

export const handler = async (event: any | null, context: Context | null): Promise<void> => {
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

    const email = event.email;
    if (!email) {
        throw new Error('email not sent');
    }
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
            const balances: any = {};
            for (const account of monteCarloInputs.accounts) {
                const startingBal = computedAssets.map((computedAsset: ComputedAsset) => {
                    if (computedAsset.asset.account === account.name) {
                        return computedAsset.price;
                    } else {
                        return 0;
                    }
                }).reduce((prev, curr) => prev + curr, 0);
                console.log(`${account.name} - $${startingBal.toFixed(2)}`)
                balances[account.id] = {
                    0: startingBal
                }
            }

            // 4. simulate for 1K steps
            const dateIm59 = new Date(monteCarloInputs.input.birthday);
            dateIm59.setFullYear(dateIm59.getFullYear() + 59);
            const endDate = new Date(monteCarloInputs.input.birthday);
            endDate.setFullYear(endDate.getFullYear() + 100);
            const dateToSlowGroth = new Date(monteCarloInputs.input.birthday);
            dateToSlowGroth.setFullYear(dateToSlowGroth.getFullYear() + 65);

            console.log('allocations: ' + JSON.stringify(monteCarloInputs.input.assetAllocation))

            const dates = dateRange(startDate, endDate);
            const simulations = simulate(
                monteCarloInputs,
                balances,
                dates,
                dateIm59,
                dateToSlowGroth,
                STEPS,
                (VTI_MEAN - (INFLATION + FEES)),
                (BND_MEAN - (INFLATION + FEES)),
                VTI_VARIANCE,
                BND_VARIANCE);

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


        return

};
