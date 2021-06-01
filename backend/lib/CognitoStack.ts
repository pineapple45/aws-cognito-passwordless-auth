import { CfnOutput, RemovalPolicy } from '@aws-cdk/core';
import * as sst from '@serverless-stack/resources';
import * as cognito from '@aws-cdk/aws-cognito';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import * as path from 'path';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as iam from '@aws-cdk/aws-iam';
import { VerifySesEmailAddress } from '@seeebiii/ses-verify-identities';

export default class CognitoStack extends sst.Stack {
  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope, id, props);

    const createAuthChallengeTrigger = new NodejsFunction(
      this,
      'create-auth-challenge',
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(6),
        handler: 'handler',
        entry: path.join(
          __dirname,
          '../../src/handlers/cognito-handlers/create-auth-challenge.ts'
        ),
        bundling: { externalModules: ['aws-sdk'] },
        environment: {
          SES_FROM_ADDRESS: process.env.SES_FROM_ADDRESS as string,
        },
      }
    );

    const defineAuthChallengeTrigger = new NodejsFunction(
      this,
      'define-auth-challenge',
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(6),
        handler: 'handler',
        entry: path.join(
          __dirname,
          '../../src/handlers/cognito-handlers/define-auth-challenge.ts'
        ),
        bundling: { externalModules: ['aws-sdk'] },
      }
    );

    const postAuthenticationTrigger = new NodejsFunction(
      this,
      'post-authentication',
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(6),
        handler: 'handler',
        entry: path.join(
          __dirname,
          '../../src/handlers/cognito-handlers/post-authentication.ts'
        ),
        bundling: { externalModules: ['aws-sdk'] },
      }
    );

    const preSignUpTrigger = new NodejsFunction(this, 'pre-sign-up', {
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(6),
      handler: 'handler',
      entry: path.join(
        __dirname,
        '../../src/handlers/cognito-handlers/pre-sign-up.ts'
      ),
      bundling: { externalModules: ['aws-sdk'] },
    });

    const verifyAuthChallengeResponseTrigger = new NodejsFunction(
      this,
      'verify-auth-challenge-response',
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(6),
        handler: 'handler',
        entry: path.join(
          __dirname,
          '../../src/handlers/cognito-handlers/verify-auth-challenge-response.ts'
        ),
        bundling: { externalModules: ['aws-sdk'] },
      }
    );

    // USERPOOL
    const userPool = new cognito.UserPool(this, 'cognito-user-pool', {
      selfSignUpEnabled: true,
      removalPolicy: RemovalPolicy.DESTROY,
      accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      autoVerify: {
        email: true,
        phone: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        phoneNumber: {
          required: true,
          mutable: true,
        },
        address: {
          required: false,
          mutable: true,
        },
      },
      signInAliases: {
        email: true,
        phone: true,
      },
      customAttributes: {
        country: new cognito.StringAttribute({ mutable: true }),
        city: new cognito.StringAttribute({ mutable: true }),
        isAdmin: new cognito.StringAttribute({ mutable: true }),
      },
      lambdaTriggers: {
        createAuthChallenge: createAuthChallengeTrigger,
        defineAuthChallenge: defineAuthChallengeTrigger,
        postAuthentication: postAuthenticationTrigger,
        preSignUp: preSignUpTrigger,
        verifyAuthChallengeResponse: verifyAuthChallengeResponseTrigger,
      },
    });

    // USERPOOL-CLIENT
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          givenName: true,
          familyName: true,
          email: true,
          emailVerified: true,
          address: true,
          birthdate: true,
          gender: true,
          locale: true,
          middleName: true,
          fullname: true,
          nickname: true,
          phoneNumber: true,
          phoneNumberVerified: true,
          profilePicture: true,
          preferredUsername: true,
          profilePage: true,
          timezone: true,
          lastUpdateTime: true,
          website: true,
        })
        .withCustomAttributes(...['country', 'city', 'isAdmin']),

      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          givenName: true,
          familyName: true,
          email: true,
          emailVerified: false,
          address: true,
          birthdate: true,
          gender: true,
          locale: true,
          middleName: true,
          fullname: true,
          nickname: true,
          phoneNumber: true,
          profilePicture: true,
          preferredUsername: true,
          profilePage: true,
          timezone: true,
          lastUpdateTime: true,
          website: true,
        })
        .withCustomAttributes(...['country', 'city']),

      authFlows: {
        custom: true,
        userSrp: true,
      },

      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],

      preventUserExistenceErrors: true,
    });

    const createAuthChallengePolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      // actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      actions: ['*'],
      resources: ['*'],
    });

    createAuthChallengeTrigger.role?.attachInlinePolicy(
      new iam.Policy(this, 'create-auth-challenge-trigger-policy', {
        statements: [createAuthChallengePolicyStatement],
      })
    );

    // IDENTITY-POOL
    const identityPool = new cognito.CfnIdentityPool(this, 'identitypool', {
      allowUnauthenticatedIdentities: true,
      // identityPoolName: `${STACK_PREFIX}-${DEPLOY_ENVIRONMENT}`,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    const isUserCognitoGroupRole = new iam.Role(this, 'users-group-role', {
      description: 'Default role for authenticated users',
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    const isAnonymousCognitoGroupRole = new iam.Role(
      this,
      'anonymous-group-role',
      {
        description: 'Default role for anonymous users',
        assumedBy: new iam.FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': identityPool.ref,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'authenticated',
            },
          },
          'sts:AssumeRoleWithWebIdentity'
        ),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }
    );

    const isAdminCognitoGroupRole = new iam.Role(this, 'admins-group-role', {
      description: 'Default role for administrator users',
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    new cognito.CfnUserPoolGroup(this, 'users-group', {
      groupName: 'Users',
      userPoolId: userPool.userPoolId,
      description: 'The default group for authenticated users',
      precedence: 3, // the role of the group with the lowest precedence - 0 takes effect and is returned by cognito:preferred_role
      roleArn: isUserCognitoGroupRole.roleArn,
    });

    new cognito.CfnUserPoolGroup(this, 'admins-group', {
      groupName: 'Admins',
      userPoolId: userPool.userPoolId,
      description: 'The group for admin users with special privileges',
      precedence: 2, // the role of the group with the lowest precedence - 0 takes effect and is returned by cognito:preferred_role
      roleArn: isAdminCognitoGroupRole.roleArn,
    });

    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      'identity-pool-role-attachment',
      {
        identityPoolId: identityPool.ref,
        roles: {
          authenticated: isUserCognitoGroupRole.roleArn,
          unauthenticated: isAnonymousCognitoGroupRole.roleArn,
        },
        roleMappings: {
          mapping: {
            type: 'Token',
            ambiguousRoleResolution: 'AuthenticatedRole',
            identityProvider: `cognito-idp.${
              cdk.Stack.of(this).region
            }.amazonaws.com/${userPool.userPoolId}:${
              userPoolClient.userPoolClientId
            }`,
          },
        },
      }
    );

    new VerifySesEmailAddress(this, 'SesEmailVerification', {
      emailAddress: process.env.SES_FROM_ADDRESS as string,
    });

    // Export values
    new CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      exportName: 'UserPoolId',
    });

    new CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      exportName: 'UserPoolClientId',
    });

    new CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref,
      exportName: 'IdentityPoolId',
    });
  }
}
