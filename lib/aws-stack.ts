import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_rds as rds,
  aws_lambda as lambda,
} from "aws-cdk-lib";
import * as apiGatewayV2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as apiGatewayV2Integrations from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

export class AwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const databaseName = "MyAuroraDb";

    const vpc = new ec2.Vpc(this, "Aurora-vpc");

    const auroraCluster = new rds.ServerlessCluster(this, "Aurora-db-cluster", {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      vpc,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        "parameter-group",
        "default.aurora-postgresql10"
      ),
      defaultDatabaseName: databaseName,
      scaling: {
        maxCapacity: rds.AuroraCapacityUnit.ACU_2,
        minCapacity: rds.AuroraCapacityUnit.ACU_2,
      },
    });

    const lambdaFunction = new lambda.Function(this, "Aurora-Lambda-function", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: new lambda.AssetCode("lambda-functions"),
      handler: "index.handler",
      memorySize: 512,
      environment: {
        CLUSTER_ARN: auroraCluster.clusterArn,
        SECRET_ARN: auroraCluster.secret?.secretArn || "",
        DB_NAME: databaseName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      },
    });

    auroraCluster.grantDataApiAccess(lambdaFunction);

    const httpApi = new apiGatewayV2.HttpApi(this, "Aurora-endpoint", {
      defaultIntegration: new apiGatewayV2Integrations.HttpLambdaIntegration(
        "LambdaIntegration",
        lambdaFunction
      ),
    });

    new CfnOutput(this, "API URL", {
      value: httpApi.url ?? "Something went wrong",
    });
  }
}
