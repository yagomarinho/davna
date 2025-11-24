export default {
  databases: {
    default_uri:
      process.env.MONGODB_DEFAULT_CONNECT_URI || 'mongodb://localhost:27017',
    account: {
      uri:
        process.env.MONGODB_ACCOUNT_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_ACCOUNT_DATABASE || 'db',
      collection: process.env.MONGODB_ACCOUNT_COLLECTION || 'accounts',
    },
    audio: {
      uri: process.env.MONGODB_AUDIO_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_AUDIO_DATABASE || 'db',
      collection: process.env.MONGODB_AUDIO_COLLECTION || 'audios',
    },
    classroom: {
      uri:
        process.env.MONGODB_CLASSROOM_CONNECT_URI ||
        'mongodb://localhost:27017',
      database: process.env.MONGODB_CLASSROOM_DATABASE || 'db',
      collection: process.env.MONGODB_CLASSROOM_COLLECTION || 'classrooms',
    },
    message: {
      uri:
        process.env.MONGODB_MESSAGE_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_MESSAGE_DATABASE || 'db',
      collection: process.env.MONGODB_MESSAGE_COLLECTION || 'messages',
    },
    session: {
      uri:
        process.env.MONGODB_SESSION_CONNECT_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_SESSION_DATABASE || 'db',
      collection: process.env.MONGODB_SESSION_COLLECTION || 'sessions',
    },
  },
  auth: {
    apiKey: {
      headerName: process.env.API_KEY_HEADER_NAME || 'x-api-key',
      key: process.env.API_ACCESS_TOKEN || 'default_access_token',
    },
    jwt: {
      secret: process.env.AUTH_SECRET || 'default_auth_secret',
      token: {
        headerName: 'authorization',
        expiresIn: 60 * 60 * 1000, // 1 hour
      },
      refresh_token: {
        headerName: 'x-refresh-authorization',
        expiresIn: 5 * 24 * 60 * 60 * 1000, // 5 days
      },
    },
  },
  providers: {
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY ?? '',
    },
    storage: {
      awsS3: {
        region: process.env.AWS_S3_STORAGE_REGION,
        bucket: process.env.AWS_S3_STORAGE_BUCKET,
        credentials: {
          accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
        },
      },
      mongodb: {
        uri:
          process.env.MONGODB_DEFAULT_CONNECT_URI ||
          'mongodb://localhost:27017',
        database: process.env.MONGODB_STORAGE_DATABASE || 'storage',
        bucket: process.env.MONGODB_STORAGE_BUCKET || 'storage',
      },
    },
  },
}
