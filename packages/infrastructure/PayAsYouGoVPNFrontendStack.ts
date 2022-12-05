import { Fn, NestedStack, StackProps } from "aws-cdk-lib";
import { CfnApp, CfnBranch } from "aws-cdk-lib/aws-amplify";
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment, UserPool } from "aws-cdk-lib/aws-cognito";
import { Effect, FederatedPrincipal, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from 'constructs';
import * as fs from 'fs';
import { getBuildSpec } from './getBuildSpec';

export interface PayAsYouGoVPNFrontendStackProps extends StackProps {
    repositoryArn: string;
    repositoryCloneUrl: string;
}

export class PayAsYouGoVPNFrontendStack extends NestedStack {
    constructor(scope: Construct, id: string, props: PayAsYouGoVPNFrontendStackProps) {
        super(scope, id, props);
        const { clientId, identityPoolId, userPoolId } = this.createCognitoResources();
        this.createAmplifyApp(props.repositoryArn, props.repositoryCloneUrl, userPoolId, clientId, identityPoolId);
    }

    private createCognitoResources() {
        const userPool = new UserPool(this, "PayAsYouGoVPNUserPool", {
            userPoolName: "PayAsYouGoVPNUserPool",
            signInAliases: {
                email: true
            },
            standardAttributes: {
                fullname: { required: true },
                email: { required: true },
                phoneNumber: { required: true },
            },
            passwordPolicy: {
                minLength: 8
            },
            selfSignUpEnabled: true
        });

        const userPoolClient = userPool.addClient("PayAsYouGoVPNUserPoolClient", {
            userPoolClientName: "PayAsYouGoVPNUserPoolClient",

        });

        const identityPool = new CfnIdentityPool(this, "PayAsYouGoVPNIdentityPool", {
            identityPoolName: "PayAsYouGoVPNIdentityPool",
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [{
                clientId: userPoolClient.userPoolClientId,
                providerName: `cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`
            }]
        });

        const authRole = new Role(this, "PayAsYouGoVPNIdPoolAuthRole", {
            roleName: "PayAsYouGoVPNIdPoolAuthRole",
            assumedBy: new FederatedPrincipal("cognito-identity.amazonaws.com", {
                StringEquals: {
                    "cognito-identity.amazonaws.com:aud": Fn.ref("PayAsYouGoVPNIdentityPool")
                },
                "ForAnyValue:StringLike": {
                    "cognito-identity.amazonaws.com:amr": "authenticated"
                }
            }, "sts:AssumeRoleWithWebIdentity"),
            inlinePolicies: {
                cogitoAnalytics: new PolicyDocument({
                    statements: [new PolicyStatement({
                        actions: [ "mobileanalytics:PutEvents", "cognito-sync:*", "cognito-identity:*" ],
                        resources: [ "*" ],
                        effect: Effect.ALLOW
                    })]
                })
            },
            // managedPolicies: [ ManagedPolicy.fromAwsManagedPolicyName("LambdaAccessManagedPolicy")]
            managedPolicies: [ ManagedPolicy.fromManagedPolicyArn(this, "managedPolicyRef", "arn:aws:iam::719694030497:policy/LambdaAccessManagedPolicy")]
        });

        const unauthRole = new Role(this, "PayAsYouGoVPNIdPoolUnauthRole", {
            roleName: "PayAsYouGoVPNIdPoolUnauthRole",
            assumedBy: new FederatedPrincipal("cognito-identity.amazonaws.com", {
                StringEquals: {
                    "cognito-identity.amazonaws.com:aud": Fn.ref("PayAsYouGoVPNIdentityPool")
                },
                "ForAnyValue:StringLike": {
                    "cognito-identity.amazonaws.com:amr": "unauthenticated"
                }
            }, "sts:AssumeRoleWithWebIdentity"),
            inlinePolicies: {
                denyAll: new PolicyDocument({
                    statements: [ new PolicyStatement({ effect: Effect.DENY, actions: [ "*" ], resources: [ "*" ] }) ]
                })
            }
        });

        new CfnIdentityPoolRoleAttachment(this, "PayAsYouGoVPNIdentityPoolRoleAttachment", {
            identityPoolId: Fn.ref("PayAsYouGoVPNIdentityPool"),
            roles: {
                authenticated: authRole.roleArn,
                unauthenticated: unauthRole.roleArn
            }
        });

        return {
            userPoolId: userPool.userPoolId,
            clientId: userPoolClient.userPoolClientId,
            identityPoolId: Fn.ref("PayAsYouGoVPNIdentityPool")
        };
    }

    private createAmplifyApp(repositoryArn: string, repositoryCloneUrl: string, userPoolId: string, clientId: string, identityPoolId: string) {
        const amplifyRole = new Role(this, "AmplifyRole", {
            roleName: "AmplifyRole",
            assumedBy: new ServicePrincipal("amplify"),
            inlinePolicies: {
                cwLogsAccess: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            effect: Effect.ALLOW,
                            resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/amplify/*`],
                            actions: [ "logs:CreateLogGroup" ]
                        }),
                        new PolicyStatement({
                            effect: Effect.ALLOW,
                            resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:*`],
                            actions: [ "logs:DescribeLogGroups" ]
                        }),
                        new PolicyStatement({
                            effect: Effect.ALLOW,
                            resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/amplify/*:log-stream:*`],
                            actions: [ "logs:CreateLogStream", "logs:PutLogEvents" ]
                        })
                    ]
                }),
                codeCommitAccess: new PolicyDocument({
                    statements: [ new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [ "codecommit:GitPull" ],
                        resources: [ repositoryArn ]
                    }) ]
                })
            }
        });

        new CfnApp(this, "PayAsYouGoVPNAmplifyApp", {
            name: "PayAsYouGoVPNAmplifyApp",
            repository: repositoryCloneUrl,
            // buildSpec: fs.readFileSync("buildSpec.yaml").toString(),
            buildSpec: getBuildSpec(userPoolId, identityPoolId, clientId, this.region),
            iamServiceRole: amplifyRole.roleArn,
        });

        new CfnBranch(this, "PayAsYouGoVPNAmplifyBranch", {
            branchName: "master",
            appId: Fn.getAtt("PayAsYouGoVPNAmplifyApp", "AppId").toString(),
            enableAutoBuild: true
        } );
    }
}