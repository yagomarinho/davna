import { resolve } from 'node:path'

export const Config = () => ({
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
    firebaseAdmin: {
      credentials: {
        type: process.env.FIREBASE_ADMIN_TYPE ?? '',
        project_id: process.env.FIREBASE_ADMIN_PROJECT_ID ?? '',
        private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID ?? '',
        private_key:
          process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? '',
        client_id: process.env.FIREBASE_ADMIN_CLIENT_ID ?? '',
        auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI ?? '',
        token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI ?? '',
        auth_provider_x509_cert_url:
          process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL ?? '',
        client_x509_cert_url:
          process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL ?? '',
        universe_domain: process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN ?? '',
      },
    },
    gcp: {
      credentials: {
        type: process.env.GCP_TYPE ?? '',
        project_id: process.env.GCP_PROJECT_ID ?? '',
        private_key_id: process.env.GCP_PRIVATE_KEY_ID ?? '',
        private_key: process.env.GCP_PRIVATE_KEY ?? ''.replace(/\\n/g, '\n'),
        client_email: process.env.GCP_CLIENT_EMAIL ?? '',
        client_id: process.env.GCP_CLIENT_ID ?? '',
        auth_uri: process.env.GCP_AUTH_URI ?? '',
        token_uri: process.env.GCP_TOKEN_URI ?? '',
        auth_provider_x509_cert_url:
          process.env.GCP_AUTH_PROVIDER_X509_CERT_URL ?? '',
        client_x509_cert_url: process.env.GCP_CLIENT_X509_CERT_URL ?? '',
        universe_domain: process.env.GCP_UNIVERSE_DOMAIN ?? '',
      },
      sheets: {
        spreadsheetId: process.env.GCP_SPREADSHEET_ID ?? '',
        range: process.env.GCP_SPREADSHEET_RANGE ?? '',
      },
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
    gpt: {
      default_driver:
        process.env.NODE_ENV === 'production' ? 'chatgpt' : 'fake.ai',
      chatgpt: {
        apiKey: process.env.OPENAI_API_KEY,
      },
      'fake.ai': {
        textToRespond: 'this is a simple response',
        textFromSpeech: 'this is a simple transcription',
        pathToSpeech: resolve(__dirname, '../../temp', 'audiotest1.m4a'),
      },
    },
  },
})
