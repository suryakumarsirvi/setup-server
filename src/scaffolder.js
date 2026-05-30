import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { spinner } from '@clack/prompts';
import { symbols } from './ui.js';
import * as templates from './templates.js';

/**
 * Orchestrates the full scaffolding process for a backend project.
 * @param {object} options 
 */
export async function scaffoldProject(options) {
    const s = spinner();
    s.start('Scaffolding workspace directories...');

    const { targetDir } = options;

    try {
        if (options.projectName !== '.') {
            await fs.ensureDir(targetDir);
        }

        const folders = [
            'src/config',
            'src/controllers',
            'src/routes',
            'src/middlewares',
            'src/models',
            'src/services',
            'src/utils',
            'src/templates',
            'src/jobs',
        ];

        for (const folder of folders) {
            await fs.ensureDir(path.join(targetDir, folder));
        }

        await generateFiles(options, s);

        s.start('Installing project dependencies...');
        try {
            await execa('npm', ['install'], { cwd: targetDir });
            s.stop('Dependencies installed successfully.');
        } catch (error) {
            s.stop('Dependency installation skipped or failed.');
        }

        s.start('Initializing local git repository...');
        try {
            await execa('git', ['init'], { cwd: targetDir });
            s.stop('Git repository initialized.');
        } catch (error) {
            s.stop('Git initialization skipped.');
        }
    } catch (error) {
        s.stop('Scaffolding halted due to an error.');
        throw error;
    }
}

/**
 * Handles all file creation procedures for the scaffolded project.
 * @param {object} options 
 * @param {object} s Clack spinner instance
 */
async function generateFiles(options, s) {
    const { targetDir, language, database, storage, emailService, middlewaresList, port } = options;
    const ext = language === 'ts' ? 'ts' : 'js';
    const isTS = language === 'ts';

    // 1. Generate package.json
    s.message('Generating configuration package.json...');
    const packageJson = templates.getPackageJson(
        options.projectName,
        isTS,
        ext,
        middlewaresList,
        database,
        storage,
        emailService,
        port
    );
    await fs.writeJSON(path.join(targetDir, 'package.json'), packageJson, { spaces: 2 });

    // 2. Generate tsconfig.json (if TypeScript)
    if (isTS) {
        s.message('Generating TypeScript compilation tsconfig.json...');
        const tsconfig = templates.getTsConfig();
        await fs.writeJSON(path.join(targetDir, 'tsconfig.json'), tsconfig, { spaces: 2 });
    }

    // 3. Generate main entry (src/index)
    s.message('Generating app core entry file...');
    const indexContent = templates.getIndexContent(middlewaresList, database, port, isTS);
    await fs.writeFile(path.join(targetDir, `src/index.${ext}`), indexContent);

    // 4. Generate middlewares/logger
    s.message('Generating request logging middleware...');
    const loggerContent = templates.getLoggerContent(isTS);
    await fs.writeFile(path.join(targetDir, `src/middlewares/logger.${ext}`), loggerContent);

    // 5. Generate config/db
    s.message('Generating database connection config...');
    const dbConfigContent = templates.getDbContent(database, isTS);
    await fs.writeFile(path.join(targetDir, `src/config/db.${ext}`), dbConfigContent);

    // 6. Generate cron jobs (if selected)
    if (middlewaresList.includes('cron')) {
        s.message('Generating cron jobs manager...');
        const cronTemplate = templates.getCronContent(isTS);
        await fs.writeFile(path.join(targetDir, `src/jobs/index.${ext}`), cronTemplate);
    }

    // 7. Generate models/User
    if (database === 'mongodb') {
        s.message('Generating primary mongoUser schema...');
        const userModelContent = templates.getMongoUserModelContent();
        await fs.writeFile(path.join(targetDir, `src/models/mongoUser.${ext}`), userModelContent);
    }

    // 8. Generate middlewares/errorHandler
    s.message('Generating global error-handling handler...');
    const errorHandlerContent = templates.getErrorHandlerContent(isTS);
    await fs.writeFile(path.join(targetDir, `src/middlewares/errorHandler.${ext}`), errorHandlerContent);

    // 9. Generate User controller
    s.message('Generating primary controller operations...');
    const userControllerContent = templates.getUserControllerContent(database, isTS);
    await fs.writeFile(path.join(targetDir, `src/controllers/user.controller.${ext}`), userControllerContent);

    // 10. Generate User routes
    s.message('Generating api routing configurations...');
    const userRoutesContent = templates.getUserRoutesContent();
    await fs.writeFile(path.join(targetDir, `src/routes/user.routes.${ext}`), userRoutesContent);

    // 11. Generate storage services
    if (storage !== 'none') {
        s.message(`Generating storage handling service [${storage}]...`);
        let storageContent = '';
        let serviceFileName = `${storage}.service.${ext}`;

        if (storage === 'local') {
            await fs.ensureDir(path.join(targetDir, 'uploads'));
            storageContent = templates.getUploadServiceContent();
            serviceFileName = `upload.service.${ext}`;
        } else if (storage === 's3') {
            storageContent = templates.getS3ServiceContent(isTS);
        } else if (storage === 'cloudinary') {
            storageContent = templates.getCloudinaryServiceContent(isTS);
        } else if (storage === 'firebase') {
            storageContent = templates.getFirebaseServiceContent(isTS);
        } else if (storage === 'uploadcare') {
            storageContent = templates.getUploadcareServiceContent(isTS);
        } else if (storage === 'mux') {
            storageContent = templates.getMuxServiceContent(isTS);
        }

        if (storageContent) {
            await fs.writeFile(path.join(targetDir, `src/services/${serviceFileName}`), storageContent);
        }
    }

    // 12. Generate email services
    if (emailService !== 'none') {
        s.message(`Generating email dispatch service [${emailService}]...`);
        let emailContent = '';

        if (emailService === 'nodemailer') {
            emailContent = templates.getNodemailerServiceContent(isTS);
        } else if (emailService === 'sendgrid') {
            emailContent = templates.getSendgridServiceContent(isTS);
        } else if (emailService === 'mailgun') {
            emailContent = templates.getMailgunServiceContent(isTS);
        } else if (emailService === 'brevo') {
            emailContent = templates.getBrevoServiceContent(isTS);
        } else if (emailService === 'mailcheap') {
            emailContent = templates.getMailcheapServiceContent(isTS);
        }

        if (emailContent) {
            await fs.writeFile(path.join(targetDir, `src/services/email.service.${ext}`), emailContent);
        }
    }

    // 13. Generate environment configurations (.env & .env.example)
    s.message('Generating dev environment dotenv configurations...');
    const envContent = templates.getEnvLines(database, storage, emailService, port);
    await fs.writeFile(path.join(targetDir, '.env'), envContent);
    await fs.writeFile(path.join(targetDir, '.env.example'), envContent);

    // 14. Generate standard .gitignore
    const gitignoreContent = `node_modules\n.env\nuploads\n`;
    await fs.writeFile(path.join(targetDir, '.gitignore'), gitignoreContent);

    s.stop('Files generated successfully.');
}
