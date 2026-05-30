/**
 * Pure functions returning code content templates for scaffolded backend structures.
 */

export const getPackageJson = (projectName, isTS, ext, middlewaresList, database, storage, emailService, port) => {
    const packageJson = {
        name: projectName === '.' ? 'express-backend' : projectName,
        version: '1.0.0',
        main: `src/index.${ext}`,
        type: 'module',
        scripts: {
            start: `node src/index.${ext}`,
            dev: isTS ? 'tsx watch src/index.ts' : 'nodemon src/index.js'
        },
        dependencies: {
            express: '^4.18.2'
        },
        devDependencies: {}
    };

    if (isTS) {
        packageJson.devDependencies = {
            typescript: '^5.0.0',
            '@types/node': '^20.0.0',
            '@types/express': '^4.17.17',
            'tsx': '^4.0.0'
        };
        if (middlewaresList.includes('cors')) packageJson.devDependencies['@types/cors'] = '^2.8.13';
        if (middlewaresList.includes('morgan')) packageJson.devDependencies['@types/morgan'] = '^1.9.4';
        if (middlewaresList.includes('cookieParser')) packageJson.devDependencies['@types/cookie-parser'] = '^1.4.3';
    } else {
        packageJson.devDependencies.nodemon = '^3.0.0';
    }

    if (middlewaresList.includes('cors')) packageJson.dependencies.cors = '^2.8.5';
    if (middlewaresList.includes('helmet')) packageJson.dependencies.helmet = '^7.0.0';
    if (middlewaresList.includes('morgan')) packageJson.dependencies.morgan = '^1.10.0';
    if (middlewaresList.includes('rateLimit')) packageJson.dependencies['express-rate-limit'] = '^6.7.0';
    if (middlewaresList.includes('cookieParser')) packageJson.dependencies['cookie-parser'] = '^1.4.6';
    if (middlewaresList.includes('dotenv')) packageJson.dependencies.dotenv = '^16.3.1';
    if (middlewaresList.includes('zod')) packageJson.dependencies.zod = '^3.21.4';
    if (middlewaresList.includes('cron')) packageJson.dependencies['cron-guardian'] = '^1.0.0';

    if (database === 'mongodb') packageJson.dependencies.mongoose = '^7.4.0';
    if (['postgresql', 'mysql', 'sqlite'].includes(database)) {
        packageJson.dependencies.sequelize = '^6.32.1';
        if (database === 'postgresql') packageJson.dependencies.pg = '^8.11.1';
        if (database === 'mysql') packageJson.dependencies.mysql2 = '^3.5.0';
        if (database === 'sqlite') packageJson.dependencies.sqlite3 = '^5.1.6';
    }

    if (storage === 'local') packageJson.dependencies.multer = '^1.4.5-lts.1';
    if (storage === 's3') packageJson.dependencies['@aws-sdk/client-s3'] = '^3.370.0';
    if (storage === 'cloudinary') packageJson.dependencies.cloudinary = '^1.37.3';
    if (storage === 'firebase') packageJson.dependencies['@firebase/storage'] = '^0.12.0';
    if (storage === 'uploadcare') packageJson.dependencies['@uploadcare/upload-client'] = '^6.0.0';
    if (storage === 'mux') packageJson.dependencies['@mux/mux-node'] = '^8.0.0';

    if (emailService === 'nodemailer') packageJson.dependencies.nodemailer = '^6.9.4';
    if (emailService === 'sendgrid') packageJson.dependencies['@sendgrid/mail'] = '^7.7.0';
    if (emailService === 'mailgun') packageJson.dependencies['mailgun.js'] = '^4.0.0';
    if (emailService === 'brevo') packageJson.dependencies['@getbrevo/brevo'] = '^2.0.0';
    if (emailService === 'mailcheap') packageJson.dependencies['nodemailer'] = '^6.9.4';

    return packageJson;
};

export const getTsConfig = () => {
    return {
        compilerOptions: {
            target: 'ESNext',
            module: 'ESNext',
            moduleResolution: 'node',
            esModuleInterop: true,
            forceConsistentCasingInFileNames: true,
            strict: true,
            skipLibCheck: true,
            outDir: './dist'
        },
        include: ['src/**/*']
    };
};

export const getIndexContent = (middlewaresList, database, port, isTS) => {
    return `import express from 'express';
${middlewaresList.includes('dotenv') ? "import 'dotenv/config';" : ""}
${middlewaresList.includes('cors') ? "import cors from 'cors';" : ""}
${middlewaresList.includes('helmet') ? "import helmet from 'helmet';" : ""}
${middlewaresList.includes('morgan') ? "import morgan from 'morgan';" : ""}
${middlewaresList.includes('cookieParser') ? "import cookieParser from 'cookie-parser';" : ""}
import { errorHandler } from './middlewares/errorHandler.js';
import connectDB from './config/db.js';
import userRoutes from './routes/user.routes.js';
import { logger } from './middlewares/logger.js';
${middlewaresList.includes('cron') ? "import './jobs/index.js';" : ""}

const app = express();

connectDB();

${middlewaresList.includes('helmet') ? "app.use(helmet());" : ""}
${middlewaresList.includes('cors') ? "app.use(cors());" : ""}
${middlewaresList.includes('morgan') ? `app.use(morgan('dev'));` : ""}
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
${middlewaresList.includes('cookieParser') ? `app.use(cookieParser());` : ""}

app.get('/', (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    res.json({ message: 'API is running' });
});

app.use('/api/users', userRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || ${port};
app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});
`;
};

export const getLoggerContent = (isTS) => {
    return `export const logger = (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}, next${isTS ? ': any' : ''}) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.url;
        const status = res.statusCode;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        console.log(\`[\${timestamp}] \${method} \${url} \${status} - \${duration}ms | IP: \${ip} | UA: \${userAgent}\`);
    });
    next();
};`;
};

export const getDbContent = (database, isTS) => {
    let dbImports = '';
    let dbConnections = '';
    if (database === 'mongodb') {
        dbImports += "import mongoose from 'mongoose';\n";
        dbConnections += `    try {
        await mongoose.connect(process.env.MONGODB_URL${isTS ? ' as string' : ''});
        console.log('MongoDB Connected');
    } catch (err${isTS ? ': any' : ''}) {
        console.error('MongoDB Error:', err.message);
    }\n`;
    }
    if (['postgresql', 'mysql', 'sqlite'].includes(database)) {
        dbImports += "import { Sequelize } from 'sequelize';\n";
        dbConnections += `    const sequelize = new Sequelize(process.env.SQL_DATABASE_URL${isTS ? ' as string' : ''});
    try {
        await sequelize.authenticate();
        console.log('SQL Database Connected');
    } catch (err${isTS ? ': any' : ''}) {
        console.error('SQL Error:', err.message);
    }\n`;
    }

    return `${dbImports}
const connectDB = async () => {
${dbConnections}
};
export default connectDB;`;
};

export const getCronContent = (isTS) => {
    return `import { SmartCron } from 'cron-guardian';

const cronManager = new SmartCron();

// Schedule an example job
cronManager.schedule('*/5 * * * *', async () => {
    console.log('Cron Job: Runs every 5 minutes');
}, {
    name: 'example-job',
    retries: 3,
    retryDelay: 5000,
    preventOverlap: true,
    onFailure: (error${isTS ? ': any' : ''}, job${isTS ? ': any' : ''}) => {
        console.error(\`Job \${job.name} failed:\`, error.message);
    }
});

export default cronManager;`;
};

export const getMongoUserModelContent = () => {
    return `import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });
export const MongoUser = mongoose.model('User', userSchema);`;
};

export const getErrorHandlerContent = (isTS) => {
    return `export const errorHandler = (err${isTS ? ': any' : ''}, req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}, next${isTS ? ': any' : ''}) => {
    const status = err.status || 500;
    res.status(status).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: status
        }
    });
};`;
};

export const getUserControllerContent = (database, isTS) => {
    return `import { logger } from '../middlewares/logger.js';
${database === 'mongodb' ? "import { MongoUser } from '../models/mongoUser.js';" : ""}

export const getUsers = async (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    try {
        ${database === 'mongodb' ? "const users = await MongoUser.find();" : "const users = [];"}
        res.json(users);
    } catch (err${isTS ? ': any' : ''}) {
        res.status(500).json({ message: err.message });
    }
};

export const register = async (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    try {
        const { name, email, password } = req.body;
        ${database === 'mongodb' ? "const user = await MongoUser.create({ name, email, password });" : "const user = { name, email, password };"}
        res.status(201).json(user);
    } catch (err${isTS ? ': any' : ''}) {
        res.status(400).json({ message: err.message });
    }
};

export const login = async (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    try {
        const { email, password } = req.body;
        ${database === 'mongodb' ? "const user = await MongoUser.findOne({ email });" : "const user = null;"}
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (err${isTS ? ': any' : ''}) {
        res.status(500).json({ message: err.message });
    }
};

export const updateProfile = async (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    try {
        const { name } = req.body;
        ${database === 'mongodb' ? "const user = await MongoUser.findByIdAndUpdate(req.params.id, { name }, { new: true });" : "const user = { name };"}
        res.json(user);
    } catch (err${isTS ? ': any' : ''}) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteUser = async (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    try {
        ${database === 'mongodb' ? "await MongoUser.findByIdAndDelete(req.params.id);" : ""}
        res.json({ message: 'User deleted' });
    } catch (err${isTS ? ': any' : ''}) {
        res.status(500).json({ message: err.message });
    }
};`;
};

export const getUserRoutesContent = () => {
    return `import express from 'express';
import { getUsers, register, login, updateProfile, deleteUser } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/', getUsers);
router.put('/profile', updateProfile);
router.delete('/:id', deleteUser);

export default router;`;
};

// Storage templates
export const getUploadServiceContent = () => {
    return `import multer from 'multer';
import path from 'path';
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
export const upload = multer({ storage });`;
};

export const getS3ServiceContent = (isTS) => {
    return `import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
const s3 = new S3Client({
    region: process.env.AWS_REGION${isTS ? ' as string' : ''},
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID${isTS ? ' as string' : ''},
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY${isTS ? ' as string' : ''}
    }
});
export const uploadToS3 = async (file: any) => {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME${isTS ? ' as string' : ''},
        Key: \`uploads/\${Date.now()}-\${file.originalname}\`,
        Body: file.buffer
    });
    return s3.send(command);
};`;
};

export const getCloudinaryServiceContent = (isTS) => {
    return `import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME${isTS ? ' as string' : ''},
    api_key: process.env.CLOUDINARY_API_KEY${isTS ? ' as string' : ''},
    api_secret: process.env.CLOUDINARY_API_SECRET${isTS ? ' as string' : ''}
});
export const uploadToCloudinary = (filePath: string) => cloudinary.uploader.upload(filePath);`;
};

export const getFirebaseServiceContent = (isTS) => {
    return `import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY${isTS ? ' as string' : ''},
    authDomain: process.env.FIREBASE_AUTH_DOMAIN${isTS ? ' as string' : ''},
    projectId: process.env.FIREBASE_PROJECT_ID${isTS ? ' as string' : ''},
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET${isTS ? ' as string' : ''},
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID${isTS ? ' as string' : ''},
    appId: process.env.FIREBASE_APP_ID${isTS ? ' as string' : ''}
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
export const uploadToFirebase = async (file: any, filename: string) => {
    const storageRef = ref(storage, \`uploads/\${filename}\`);
    return uploadBytes(storageRef, file.buffer);
};`;
};

export const getUploadcareServiceContent = (isTS) => {
    return `import { UploadcareClient } from '@uploadcare/upload-client';
const client = new UploadcareClient({
    publicKey: process.env.UPLOADCARE_PUBLIC_KEY${isTS ? ' as string' : ''}
});
export const uploadToUploadcare = async (file: any) => {
    return client.uploadFile(file.buffer, {
        fileName: file.originalname,
        contentType: file.mimetype
    });
};`;
};

export const getMuxServiceContent = (isTS) => {
    return `import { Mux } from '@mux/mux-node';
const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID${isTS ? ' as string' : ''},
    tokenSecret: process.env.MUX_TOKEN_SECRET${isTS ? ' as string' : ''}
});
export const uploadToMux = async (url: string) => {
    return mux.video.uploads.create({
        url: url,
        new_asset_settings: {
            playback_policy: 'public'
        }
    });
};`;
};

// Email templates
export const getNodemailerServiceContent = (isTS) => {
    return `import nodemailer from 'nodemailer';
export const sendEmail = async (to${isTS ? ': string' : ''}, subject${isTS ? ': string' : ''}, html${isTS ? ': string' : ''}) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST${isTS ? ' as string' : ''},
        port: Number(process.env.MAIL_PORT),
        auth: { user: process.env.MAIL_USER${isTS ? ' as string' : ''}, pass: process.env.MAIL_PASS${isTS ? ' as string' : ''} }
    });
    await transporter.sendMail({
        from: process.env.MAIL_FROM${isTS ? ' as string' : ''},
        to,
        subject,
        html
    });
};`;
};

export const getSendgridServiceContent = (isTS) => {
    return `import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY${isTS ? ' as string' : ''});
export const sendEmail = async (to${isTS ? ': string' : ''}, subject${isTS ? ': string' : ''}, html${isTS ? ': string' : ''}) => {
    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL${isTS ? ' as string' : ''},
        subject,
        html
    };
    await sgMail.send(msg);
};`;
};

export const getMailgunServiceContent = (isTS) => {
    return `import formData from 'form-data';
import Mailgun from 'mailgun.js';
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY${isTS ? ' as string' : ''}
});
export const sendEmail = async (to${isTS ? ': string' : ''}, subject${isTS ? ': string' : ''}, html${isTS ? ': string' : ''}) => {
    const data = {
        from: process.env.MAILGUN_FROM_EMAIL${isTS ? ' as string' : ''},
        to,
        subject,
        html
    };
    return mg.messages.create(process.env.MAILGUN_DOMAIN${isTS ? ' as string' : ''}, data);
};`;
};

export const getBrevoServiceContent = (isTS) => {
    return `import brevo from '@getbrevo/brevo';
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY${isTS ? ' as string' : ''}
);
export const sendEmail = async (to${isTS ? ': string' : ''}, subject${isTS ? ': string' : ''}, html${isTS ? ': string' : ''}) => {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = { email: process.env.BREVO_FROM_EMAIL${isTS ? ' as string' : ''} };
    sendSmtpEmail.to = [{ email: to }];
    return apiInstance.sendTransacEmail(sendSmtpEmail);
};`;
};

export const getMailcheapServiceContent = (isTS) => {
    return `import nodemailer from 'nodemailer';
export const sendEmail = async (to${isTS ? ': string' : ''}, subject${isTS ? ': string' : ''}, html${isTS ? ': string' : ''}) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAILCHEAP_HOST${isTS ? ' as string' : ''},
        port: Number(process.env.MAILCHEAP_PORT),
        auth: { 
            user: process.env.MAILCHEAP_USER${isTS ? ' as string' : ''}, 
            pass: process.env.MAILCHEAP_PASS${isTS ? ' as string' : ''}
        }
    });
    await transporter.sendMail({
        from: process.env.MAILCHEAP_FROM${isTS ? ' as string' : ''},
        to,
        subject,
        html
    });
};`;
};

// Env configurations
export const getEnvLines = (database, storage, emailService, port) => {
    let envLines = [`PORT=${port}`];
    if (database === 'mongodb') envLines.push('MONGODB_URL=mongodb://localhost:27017/mydb');
    if (['postgresql', 'mysql', 'sqlite'].includes(database)) envLines.push('SQL_DATABASE_URL=postgres://user:pass@localhost:5432/mydb');
    if (storage === 's3') {
        envLines.push('AWS_REGION=us-east-1');
        envLines.push('AWS_ACCESS_KEY_ID=your_access_key');
        envLines.push('AWS_SECRET_ACCESS_KEY=your_secret_key');
        envLines.push('AWS_BUCKET_NAME=your_bucket_name');
    }
    if (storage === 'cloudinary') {
        envLines.push('CLOUDINARY_CLOUD_NAME=your_cloud_name');
        envLines.push('CLOUDINARY_API_KEY=your_api_key');
        envLines.push('CLOUDINARY_API_SECRET=your_api_secret');
    }
    if (storage === 'firebase') {
        envLines.push('FIREBASE_API_KEY=your_firebase_api_key');
        envLines.push('FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com');
        envLines.push('FIREBASE_PROJECT_ID=your_project_id');
        envLines.push('FIREBASE_STORAGE_BUCKET=your_project.appspot.com');
        envLines.push('FIREBASE_MESSAGING_SENDER_ID=123456789');
        envLines.push('FIREBASE_APP_ID=1:123456789:web:abcdef');
    }
    if (storage === 'uploadcare') {
        envLines.push('UPLOADCARE_PUBLIC_KEY=your_uploadcare_public_key');
    }
    if (storage === 'mux') {
        envLines.push('MUX_TOKEN_ID=your_mux_token_id');
        envLines.push('MUX_TOKEN_SECRET=your_mux_token_secret');
    }
    if (emailService === 'nodemailer') {
        envLines.push('MAIL_HOST=smtp.example.com');
        envLines.push('MAIL_PORT=587');
        envLines.push('MAIL_USER=your_email@example.com');
        envLines.push('MAIL_PASS=your_password');
        envLines.push('MAIL_FROM="Your App" <noreply@example.com>');
    }
    if (emailService === 'sendgrid') {
        envLines.push('SENDGRID_API_KEY=your_sendgrid_api_key');
        envLines.push('SENDGRID_FROM_EMAIL=noreply@example.com');
    }
    if (emailService === 'mailgun') {
        envLines.push('MAILGUN_API_KEY=your_mailgun_api_key');
        envLines.push('MAILGUN_DOMAIN=mg.example.com');
        envLines.push('MAILGUN_FROM_EMAIL=noreply@example.com');
    }
    if (emailService === 'brevo') {
        envLines.push('BREVO_API_KEY=your_brevo_api_key');
        envLines.push('BREVO_FROM_EMAIL=noreply@example.com');
    }
    if (emailService === 'mailcheap') {
        envLines.push('MAILCHEAP_HOST=smtp.mailcheap.co');
        envLines.push('MAILCHEAP_PORT=587');
        envLines.push('MAILCHEAP_USER=your_email@example.com');
        envLines.push('MAILCHEAP_PASS=your_password');
        envLines.push('MAILCHEAP_FROM="Your App" <noreply@example.com>');
    }

    return envLines.join('\n') + '\n';
};
