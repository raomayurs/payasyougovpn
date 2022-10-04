import { Duration, NestedStack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';

export class PayAsYouGoVPNServiceStack extends NestedStack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.createLambdas();
    }

    private createLambdas() {
        const functionDetails = [ 
            {functionName: "StartVPNServer", handler: "index.startServer"},
            {functionName: "StopVPNServer", handler: "index.stopServer"},
            {functionName: "StopAllIdleServers", handler: "index.stopAllIdleServers"},
            {functionName: "GetServerDetails", handler: "index.getServerDetails"},
            {functionName: "GetVPNSessions", handler: "index.getVPNSessions"}, 
        ];

        const lambdaExecutionRole = new Role(this, "PayAsYouGoVPNLambdaExecutionRole", {
            roleName: "PayAsYouGoVPNLambdaExecutionRole",
            assumedBy: new ServicePrincipal("lambda"),
            inlinePolicies: {
                lambdaBasic: new PolicyDocument({
                    statements: [ new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [ "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents" ],
                        resources: [ "*" ]
                    }) ]
                }),
                s3Access: new PolicyDocument({
                    statements: [ new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [ "s3:*" ],
                        resources: [ "*" ]
                    }) ]
                }),
                ec2Access: new PolicyDocument({
                    statements: [ new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [ "ec2:*" ],
                        resources: [ "*" ]
                    }) ]
                }),
                assumeRoleAccess: new PolicyDocument({
                    statements: [ new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [ "sts:AssumeRole" ],
                        resources: [ "arn:aws:iam::719694030497:role/EC2AccessRole" ]
                    }) ]
                }), 
            }
        });

        const functions = functionDetails.map((functionDetail) => {
            return new Function(this, functionDetail.functionName, {
                functionName: functionDetail.functionName,
                runtime: Runtime.NODEJS_14_X,
                code: Code.fromAsset("lambda.zip"),
                handler: functionDetail.handler,
                role: lambdaExecutionRole,
                timeout: Duration.minutes(2)
            });
        });

        new ManagedPolicy(this, "LambdaAccessManagedPolicy", {
            managedPolicyName: "LambdaAccessManagedPolicy",
            document: new PolicyDocument({
                statements: [new PolicyStatement({
                    actions: [ "lambda:InvokeFunction" ],
                    resources: functions.map(f => f.functionArn),
                    effect: Effect.ALLOW
                })]
            })
        });
    }
}