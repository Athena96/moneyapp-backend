
import { UserType } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import CognitoIdentityServiceProvider = require('aws-sdk/clients/cognitoidentityserviceprovider');

export class CognitoHelper {
    private cognitoClient: CognitoIdentityServiceProvider;

    constructor(cognitoClient: CognitoIdentityServiceProvider) {
        this.cognitoClient = cognitoClient;
    }

    async getUsersInPool(poolId: string): Promise<UserType[]> {
        const resp = await this.cognitoClient.listUsers({
            UserPoolId: poolId, /* required */
            Limit: 50,
          }).promise();
        if (resp && resp.Users) {
            return resp.Users;
        } else {
            throw new Error('could not get users.')
        }
    }

    public getEmail(user: UserType): string {
        if (user.Attributes) {
            for (const attr of user.Attributes) {
                if (attr.Name === 'email') {
                    if (attr.Value) {
                        return attr.Value;
                    }
                }
            }
        }
        throw new Error('could not get email')
    }

}