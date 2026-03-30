const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_USER_POOL_ID,
            userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
            identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
            loginWith: {
                email: true,
            },
            signUpVerificationMethod: 'code',
            userAttributes: {
                email: {
                    required: true,
                },
            },
            allowGuestAccess: true,
            passwordFormat: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSpecialCharacters: false,
            },
        },
    },
    Storage: {
        S3: {
            bucket: import.meta.env.VITE_S3_BUCKET,
            region: 'sa-east-1',
        }
    }
};

export default awsConfig;
