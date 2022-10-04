import {
	CognitoUserPool,
	CognitoUserAttribute,
	CognitoUser,
	AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import * as uuid from "uuid";

import * as AWS from "aws-sdk";

export type UserData = {
	name: string,
	email: string,
	phone_number: string,
	password: string
}

function parseJwt (token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

export class CognitoClient {
	private userPool: CognitoUserPool;

	constructor(private userpoolId: string, private identityPoolId: string, private clientId: string, private region: string) {
		const poolData = {
			UserPoolId: this.userpoolId,
			ClientId: clientId,
		};
		this.userPool = new CognitoUserPool(poolData);
	}

	registerUser(userData: UserData) {
		const attributeList: CognitoUserAttribute[] = [];
		const data = userData as any;
		Object.keys(data).forEach((key) => {
			if (key !== "password") {
				const value = data[key];
				attributeList.push(new CognitoUserAttribute({ Name: key, Value: value}));
			}
		});

		return new Promise((resolve, reject) => {
			this.userPool.signUp(userData.email, userData.password, attributeList, [], (
				err: Error | undefined,
				result: any
			) => {
				if (err) {
					reject(err);
				}
				const cognitoUser = result.user;
				resolve(result);
			});
		});
	}

	confirmRegistration(code: string, username: string) {
		const userData = {
			Username: username,
			Pool: this.userPool,
		};

		const cognitoUser = new CognitoUser(userData);
		return new Promise((resolve, reject) => {
			cognitoUser.confirmRegistration(code, true, (err, result) => {
				if (err) {
					reject(err);
				}
				resolve(result);
			});
		});
	}

	async authenticateUser(username: string, password: string) {
		//await (Auth as any)._storage.clear() 
		const authenticationData = {
			Username: username,
			Password: password,
		};
		const authenticationDetails = new AuthenticationDetails(authenticationData);

		const userData = {
			Username: username,
			Pool: this.userPool,
		};

		const cognitoUser = new CognitoUser(userData);
		return new Promise<void>((resolve, reject) => {
			cognitoUser.authenticateUser(authenticationDetails, {
				onSuccess: async (result) => {
					const accessToken = result.getAccessToken().getJwtToken();
					const cognitoUrl = `cognito-idp.${this.region}.amazonaws.com/${this.userpoolId}`;
					const idToken = result.getIdToken().getJwtToken();
					console.log(idToken)
					AWS.config.credentials = new AWS.CognitoIdentityCredentials({
						IdentityPoolId: this.identityPoolId,
						Logins: { [cognitoUrl] : idToken},
					}, {region: this.region });
				    (AWS.config.credentials as any).clearCachedId();
					(AWS?.config?.credentials as any).refresh((error: any) => {
						if (error) {
							console.log(error)
						  reject(new Error(error));
						} else {
						  (AWS.config.credentials as any).get(function() {
								AWS.config.update({
								accessKeyId: AWS.config.credentials?.accessKeyId,
								secretAccessKey: AWS.config.credentials?.secretAccessKey,
								sessionToken: AWS.config.credentials?.sessionToken
								})
								const accessKeyId = AWS.config.credentials?.accessKeyId as string;
								const secretAccessKey = AWS.config.credentials?.secretAccessKey as string;
								const sessionToken = AWS.config.credentials?.sessionToken as string;
								if (accessKeyId && secretAccessKey && sessionToken) {
									sessionStorage.setItem("accessKeyId", accessKeyId);
									sessionStorage.setItem("secretAccessKey", secretAccessKey);
									sessionStorage.setItem("sessionToken", sessionToken);
								}
								resolve();
							});
						}
					});
					const data = parseJwt(idToken);
					const userId = data["cognito:username"];
					console.log(data)
					sessionStorage.setItem("email", username);
					sessionStorage.setItem("userId", userId);
				},
			
				onFailure: (err) => {
					reject(err)
				},
			});

			
		});

	}

	signOut() {
		const username = sessionStorage.getItem("email") as string;
		if (!username) {
			throw new Error("Username not found");
		}
		const userData = {
			Username: username,
			Pool: this.userPool,
		};

		const cognitoUser = new CognitoUser(userData);
		cognitoUser.signOut();
		sessionStorage.clear();

	}
}

