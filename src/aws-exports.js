const awsConfig = {
  aws_project_region: 'us-east-1',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: 'us-east-1_iI3UrRXf7',
  aws_user_pools_web_client_id: '28p7f7r7872md1aepoptpm93co',
  oauth: {
    domain: 'us-east-1ii3urrxf7.auth.us-east-1.amazoncognito.com',
    scope: ['openid','email'],
    redirectSignIn: 'http://localhost:3000/',
    redirectSignOut: 'http://localhost:3000/logout',
    responseType: 'code'
  },
  // identity pool for S3-signed creds
  Auth: {
    identityPoolId: 'us-east-1:9ea370d6-588a-4223-af65-3f9e37a2b25f',
    mandatorySignIn: true
  },
  Storage: {
    AWSS3: {
      bucket: 'xyz-logistics-uploads-296062554356',
      region: 'us-east-1'
    }
  }
};

export default awsConfig;
