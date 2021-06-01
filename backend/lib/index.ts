import * as sst from '@serverless-stack/resources';
import CognitoStack from './CognitoStack';

export default function main(app: sst.App): void {
  // Set default runtime for all functions
  app.setDefaultFunctionProps({
    runtime: 'nodejs12.x',
  });

  new CognitoStack(app, 'cognito');
}
