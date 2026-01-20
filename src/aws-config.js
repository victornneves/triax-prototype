const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: 'sa-east-1_Jw98XU6oe',
            userPoolClientId: '2jqbrs353aipm3pd034ei9sph8',
            identityPoolId: 'sa-east-1:c098c9c8-4f64-44a4-8e20-72d34e21e68f',
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
            bucket: 'storagestack-aitriagedevsessionbucketec01eff9-m7nvints9cab',
            region: 'sa-east-1',
        }
    }
};

export default awsConfig;
