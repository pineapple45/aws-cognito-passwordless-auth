## About

This is an ongoing sample project to show passwordless user authentication with both email and phone number. The Authentication service that is being used is AWS Cognito. The project used serverless backend which is acheived with the help 2 important open source tool kits:

1. [Serverless stack](https://docs.serverless-stack.com/)
2. [AWS CDK](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-construct-library.html)

## How to run the project

### Running the Backend

In the backend directory a dotenv file is needed at the root level. The file must contain environment variables as follows:

```
AMAZON_AWS_ACCESS_KEY_ID=<YOUR_AMAZON_AWS_ACCESS_KEY_ID>
AMAZON_AWS_SECRET_ACCESS_KEY=<YOUR_AMAZON_AWS_SECRET_ACCESS_KEY>
AMAZON_AWS_REGION=<YOUR_AMAZON_AWS_REGION>
SES_FROM_ADDRESS=<THE_SOURCE_EMAIL_FROM_WHICH_EMAILS_WILL_BE_SENT>
```

Now in the command prompt perform the following steps in sequence

```
cd backend/
npm install
npx sst start
```

An output will be shown after all stacks are successfully created on the server. Identity-pool-id, userpool-id and userpool-client-id will be shown out as output,

## Running the Frontend

In the frontend an _aws-amplify-config.ts_ file is needed inside the _src_ folder which will store all the configuration required for connecting to our cloud server. Place the config object inside _aws-amplify-config.ts_ file as follows:

```
const config = {
  Auth: {
    identityPoolId: 'YOUR_IDENTITY_POOL_ID ', // (required) - Amazon Cognito Identity Pool ID
    region: 'YOUR_AWS_COGNITO_REGION', // (required) - Amazon Cognito Region
    userPoolId: 'YOUR_USERPOOL_ID', // (optional) - Amazon Cognito User Pool ID
    userPoolWebClientId: 'YOUR_USER_POOL_WEB_CLIENT_ID', // (optional) - Amazon Cognito Web Client ID (App client secret needs to be disabled)
  },
};

export default config;

```

Now to start frontend:

```
cd frontend/
npm install
npm start
```

A new project should open on localhost:3000

## References

- https://bobbyhadz.com/blog/aws-amplify-react-auth
- https://github.com/aws-samples/amazon-cognito-passwordless-email-auth
- https://dev.to/duarten/passwordless-authentication-with-cognito-13c
- https://github.com/seeebiii/ses-verify-identities/tree/main/src
