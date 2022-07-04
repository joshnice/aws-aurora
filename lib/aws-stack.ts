import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_ec2 as ec2, aws_rds as rds } from "aws-cdk-lib";

export class AwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Aurora-vpc");

    const aurora = new rds.ServerlessCluster(this, "Aurora-db-cluster", {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      vpc,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        "parameter-group",
        "default.aurora-postgresql10"
      ),
      defaultDatabaseName: "MyDb",
      scaling: {
        maxCapacity: rds.AuroraCapacityUnit.ACU_2,
        minCapacity: rds.AuroraCapacityUnit.ACU_2,
      },
    });
  }
}
