import { intro, outro, text, select, multiselect, confirm, note, cancel } from '@clack/prompts';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { scaffoldProject } from './scaffolder.js';
import { symbols, getDivider, printDivider } from './ui.js';

/**
 * Visual choices for Language Selection
 */
const LANGUAGE_OPTIONS = [
    { value: 'ts', label: chalk.cyan('● TypeScript') },
    { value: 'js', label: chalk.yellow('● JavaScript') },
];

/**
 * Visual choices for Database Configuration
 */
const DATABASE_OPTIONS = [
    { value: 'mongodb', label: chalk.green('● MongoDB') + chalk.dim(' (Mongoose)') },
    { value: 'postgresql', label: chalk.blue('● PostgreSQL') },
    { value: 'mysql', label: chalk.yellow('● MySQL') },
    { value: 'sqlite', label: chalk.cyan('● SQLite') },
    { value: 'none', label: chalk.dim('○ None') },
];

/**
 * Visual choices for Middleware Selection
 */
const MIDDLEWARE_OPTIONS = [
    { value: 'cors', label: chalk.green('● CORS') + chalk.gray(' (Cross-Origin Resource Sharing)'), hint: 'Recommended' },
    { value: 'helmet', label: chalk.green('● Helmet') + chalk.gray(' (Security Headers)'), hint: 'Recommended' },
    { value: 'morgan', label: chalk.yellow('○ Morgan') + chalk.gray(' (HTTP Request Logger)'), hint: 'Optional' },
    { value: 'rateLimit', label: chalk.yellow('○ Rate Limit') + chalk.gray(' (API Rate Limiting)'), hint: 'Optional' },
    { value: 'cookieParser', label: chalk.yellow('○ Cookie Parser') + chalk.gray(' (Cookie Handling)'), hint: 'Optional' },
    { value: 'dotenv', label: chalk.green('● Dotenv') + chalk.gray(' (Environment Variables)'), hint: 'Recommended' },
    { value: 'nodemon', label: chalk.yellow('○ Nodemon') + chalk.gray(' (Auto-restart Dev)'), hint: 'Optional' },
    { value: 'zod', label: chalk.yellow('○ Zod') + chalk.gray(' (Schema Validation)'), hint: 'Optional' },
    { value: 'cron', label: chalk.yellow('○ Cron Jobs') + chalk.gray(' (cron-guardian)'), hint: 'Advanced' },
];

/**
 * Visual choices for Media Storage Configuration
 */
const STORAGE_OPTIONS = [
    { value: 'local', label: chalk.green('● Local') + chalk.dim(' (Multer upload)') },
    { value: 's3', label: chalk.blue('● AWS S3') },
    { value: 'cloudinary', label: chalk.cyan('● Cloudinary') },
    { value: 'firebase', label: chalk.yellow('● Firebase Storage') },
    { value: 'uploadcare', label: chalk.magenta('● Uploadcare') },
    { value: 'mux', label: chalk.red('● Mux') + chalk.dim(' (Video streaming)') },
    { value: 'none', label: chalk.dim('○ None') },
];

/**
 * Visual choices for Email Dispatching
 */
const EMAIL_OPTIONS = [
    { value: 'none', label: chalk.dim('○ None') },
    { value: 'nodemailer', label: chalk.green('● Nodemailer') + chalk.dim(' (SMTP service)') },
    { value: 'sendgrid', label: chalk.blue('● SendGrid') },
    { value: 'mailgun', label: chalk.yellow('● Mailgun') },
    { value: 'brevo', label: chalk.cyan('● Brevo') + chalk.dim(' (Transactional)') },
    { value: 'mailcheap', label: chalk.magenta('● Mailcheap') },
];

/**
 * Executes a quick setup using the provided project name directory.
 * @param {string} projectName 
 */
export async function quickSetup(projectName) {
    intro(chalk.bgBlue.white(' SETUP PROJECT SCAFFOLD '));
    console.log(getDivider(60, true));
    console.log(chalk.cyan('› Project path: ') + chalk.white.bold(projectName));
    console.log(getDivider(60, true));
    console.log(chalk.dim('ℹ Note: Press Ctrl+C at any time to abort.'));
    console.log('');

    try {
        const language = await select({
            message: 'Select project language:',
            options: LANGUAGE_OPTIONS,
        });

        const databases = await select({
            message: 'Select database engine:',
            options: DATABASE_OPTIONS,
        });

        console.log(getDivider(60));

        const middlewaresList = await multiselect({
            message: 'Select optional tools and middlewares:',
            options: MIDDLEWARE_OPTIONS,
            required: false,
            initialValues: ['cors', 'helmet', 'dotenv'],
        });

        console.log(getDivider(60));

        const storages = await select({
            message: 'Select media storage provider:',
            options: STORAGE_OPTIONS,
        });

        console.log(getDivider(60));

        const emailService = await select({
            message: 'Select email service provider:',
            options: EMAIL_OPTIONS,
        });

        console.log(getDivider(60));

        const port = await text({
            message: 'Configure server port (default: 8080):',
            placeholder: '8080',
            validate: (value) => {
                if (value && isNaN(Number(value))) return chalk.red('Error: Port must be a valid number');
            }
        });

        const finalPort = port || '8080';

        console.log(getDivider(60));

        const summary =
            `Project Directory:  ${projectName}\n` +
            `Language:           ${language.toUpperCase()}\n` +
            `Database:           ${databases !== 'none' ? databases : 'None'}\n` +
            `Middlewares:        ${middlewaresList.join(', ') || 'None'}\n` +
            `Media Storage:      ${storages !== 'none' ? storages : 'None'}\n` +
            `Email Service:      ${emailService !== 'none' ? emailService : 'None'}\n` +
            `Server Port:        ${finalPort}`;

        note(summary, 'Configuration Summary');

        const proceed = await confirm({
            message: 'Apply this configuration and start installation?',
        });

        if (!proceed || typeof proceed !== 'boolean') {
            const exitConfirm = await confirm({
                message: 'Are you sure you want to abort the setup?',
            });
            if (exitConfirm) {
                outro(chalk.yellow('Setup aborted.'));
                process.exit(0);
            } else {
                return await quickSetup(projectName);
            }
        }

        const scaffoldOptions = {
            projectName,
            language,
            database: databases,
            middlewaresList,
            storage: storages,
            emailService,
            port: finalPort,
            targetDir: path.resolve(process.cwd(), projectName)
        };

        await scaffoldProject(scaffoldOptions);

        let nextSteps = `  cd ${projectName}\n`;
        nextSteps += `  npm run dev`;

        outro(`${chalk.green.bold('Success: Scaffold completed successfully.')}

${chalk.cyan('Getting Started:')}
${chalk.cyan(nextSteps)}

${chalk.dim('Dependencies installed & Git repository initialized.')}`);
    } catch (error) {
        if (error instanceof Error && error.message === 'cancelled') {
            outro(chalk.yellow('Setup aborted.'));
        } else {
            outro(chalk.red('Error: An unexpected error occurred during setup.'));
            console.error(error);
        }
        process.exit(1);
    }
}

/**
 * Prompts user for all setup steps interactively from current or custom folder.
 */
export async function mainSetup() {
    intro(chalk.bgBlue.white(' SETUP PROJECT SCAFFOLD '));
    console.log(getDivider(60, true));
    console.log(chalk.dim('ℹ Note: Press Ctrl+C at any time to abort.'));
    console.log(getDivider(60, true));

    try {
        const projectLocation = await select({
            message: 'Where should the project files be initialized?',
            options: [
                { value: 'current', label: chalk.green('● Current Directory') },
                { value: 'new', label: chalk.blue('● New Sub-directory') },
            ],
        });

        console.log(getDivider(60));

        let projectName = '.';
        if (projectLocation === 'new') {
            const name = await text({
                message: 'Enter target folder directory name:',
                placeholder: 'my-backend',
                validate: (value) => {
                    if (!value) return 'Directory name is required';
                    if (fs.existsSync(value)) return 'Target directory already exists';
                },
            });
            projectName = name;
        }

        const language = await select({
            message: 'Select project language:',
            options: LANGUAGE_OPTIONS,
        });

        const databases = await select({
            message: 'Select database engine:',
            options: DATABASE_OPTIONS,
        });

        console.log(getDivider(50));

        const middlewaresList = await multiselect({
            message: 'Select optional tools and middlewares:',
            options: MIDDLEWARE_OPTIONS,
            required: false,
            initialValues: ['cors', 'helmet', 'dotenv'],
        });

        console.log(getDivider(50));

        const storages = await select({
            message: 'Select media storage provider:',
            options: STORAGE_OPTIONS,
        });

        console.log(getDivider(50));

        const emailService = await select({
            message: 'Select email service provider:',
            options: EMAIL_OPTIONS,
        });

        console.log(getDivider(50));

        const port = await text({
            message: 'Configure server port (default: 8080):',
            placeholder: '8080',
            validate: (value) => {
                if (value && isNaN(Number(value))) return 'Port must be a valid number';
            }
        });

        const finalPort = port || '8080';

        console.log(getDivider(50));

        const summary =
            `Project Directory:  ${projectName}\n` +
            `Language:           ${language.toUpperCase()}\n` +
            `Database:           ${databases !== 'none' ? databases : 'None'}\n` +
            `Middlewares:        ${middlewaresList.join(', ') || 'None'}\n` +
            `Media Storage:      ${storages !== 'none' ? storages : 'None'}\n` +
            `Email Service:      ${emailService !== 'none' ? emailService : 'None'}\n` +
            `Server Port:        ${finalPort}`;

        note(summary, 'Configuration Summary');

        const proceed = await confirm({
            message: 'Apply this configuration and start installation?',
        });

        if (!proceed || typeof proceed !== 'boolean') {
            outro(chalk.yellow('Setup aborted.'));
            process.exit(0);
        }

        const scaffoldOptions = {
            projectName,
            language,
            database: databases,
            middlewaresList,
            storage: storages,
            emailService,
            port: finalPort,
            targetDir: projectName === '.' ? process.cwd() : path.resolve(process.cwd(), projectName)
        };

        await scaffoldProject(scaffoldOptions);

        let nextSteps = '';
        if (projectName !== '.') {
            nextSteps += `  cd ${projectName}\n`;
        }
        nextSteps += `  npm run dev`;

        outro(`${chalk.green.bold('Success: Scaffold completed successfully.')}

${chalk.cyan('Getting Started:')}
${chalk.cyan(nextSteps)}

${chalk.dim('Dependencies installed & Git repository initialized.')}`);
    } catch (error) {
        if (error instanceof Error && error.message === 'cancelled') {
            outro(chalk.yellow('Setup aborted.'));
        } else {
            outro(chalk.red('Error: An unexpected error occurred during setup.'));
            console.error(error);
        }
        process.exit(1);
    }
}
