import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as apigw from "@aws-cdk/aws-apigateway";
import * as iam from "@aws-cdk/aws-iam";

import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs"
import { Duration } from "@aws-cdk/core";
import { ManagedPolicy } from "aws-cdk-lib/aws-iam";

export class CdkServerlessGetStartedStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // allow postFunction to call DDB and cognito
    const postFunctionLambdaRole = new iam.Role(this, 'PostFunctionLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    
    postFunctionLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );
    postFunctionLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonCognitoPowerUser')
    );
    postFunctionLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );
    

    // lambda function
    const apiRouterFunction = new lambda.Function(this, "ApiRouterFunction", {
      functionName: 'ApiRouterFunction',
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 2048,
      timeout: Duration.seconds(600),
      code: new lambda.AssetCode('src'),
      handler: "handlers/apiRouter.handler",
      environment: {
        DELETE_FUNCTION_NAME: "DeleteHandlerFunction",
        POST_FUNCTION_NAME: "PostHandlerFunction"
      },
    });

    const postFunction = new lambda.Function(this, "PostHandlerFunction", {
      functionName: 'PostHandlerFunction',
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 2048,
      timeout: Duration.seconds(600),
      code: new lambda.AssetCode('src'),
      handler: "handlers/post.handler",
      environment: {
        POOL_ID: "us-west-2_13hsr5Ccs",
      },
      role: postFunctionLambdaRole
    });

    const deleteFunction = new lambda.Function(this, "DeleteHandlerFunction", {
      functionName: 'DeleteHandlerFunction',
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 2048,
      timeout: Duration.seconds(600),
      code: new lambda.AssetCode('src'),
      handler: "handlers/delete.handler",
      environment: {
        TEST: "TEST_VA",
      },
    });

    // allow apiRouterFunction to invoke deleteFunction and postFunction
    deleteFunction.grantInvoke(apiRouterFunction);
    postFunction.grantInvoke(apiRouterFunction);


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
