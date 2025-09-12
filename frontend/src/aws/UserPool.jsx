import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
    UserPoolId: "us-east-1_V2oTCr6Jg",
    ClientId: "2k4ish6qqks2nq1ghk48nc81td"
}

const userPool = new CognitoUserPool(poolData);

export default userPool;