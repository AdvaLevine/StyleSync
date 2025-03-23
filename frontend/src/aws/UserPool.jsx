import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
    UserPoolId: "us-east-1_LvYLNwjnh",
    ClientId: "6jt8p3s82dcj78eomqpra1qo0i"
}

const userPool = new CognitoUserPool(poolData);

export default userPool;