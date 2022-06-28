import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as apigw from "@aws-cdk/aws-apigateway";
import { Duration } from "@aws-cdk/core";

export class CdkServerlessGetStartedStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // lambda function
    const apiRouterFunction = new lambda.Function(this, "ApiRouterFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 2048,
      timeout: Duration.seconds(600),
      code: lambda.Code.asset("src/handlers"),
      handler: "apiRouter.handler",
      environment: {
        TEST: "TEST_VA",
      },
    });

    const api = new apigw.RestApi(this, "money-tomorrow-api", {
      restApiName: 'Rest-Name',
      description: 'api for money tomorrow app',
      defaultCorsPreflightOptions: {
        allowHeaders: ["*"],
        allowMethods:  ["*"],
        allowOrigins:  ["*"],
      }
    });

    const auth = new apigw.CfnAuthorizer(this, 'APIGatewayAuthorizer', {
        name: 'customer-authorizer',
        identitySource: 'method.request.header.Authorization',
        providerArns: ["arn:aws:cognito-idp:us-west-2:173916683421:userpool/us-west-2_13hsr5Ccs"],
        restApiId: api.restApiId,
        type: apigw.AuthorizationType.COGNITO,
    });

    api.root
      .resourceForPath("router")
      .addMethod("POST", new apigw.LambdaIntegration(apiRouterFunction));
    api.root
      .resourceForPath("router")
      .addMethod("DELETE", new apigw.LambdaIntegration(apiRouterFunction))
  }
}
