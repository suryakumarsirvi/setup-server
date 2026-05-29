#!/usr/bin/env node

import { quickSetup, mainSetup } from './src/prompts.js';
import { generateCRUD } from './src/crud.js';

async function main() {
    const args = process.argv.slice(2);
    const crudIndex = args.indexOf('--crud');

    // 1. If --crud flag is set, run the automated CRUD generator
    if (crudIndex !== -1 && args[crudIndex + 1]) {
        const crudModel = args[crudIndex + 1];
        await generateCRUD(crudModel);
        process.exit(0);
    }

    // 2. If a single folder argument is passed directly, trigger direct setup
    if (args.length === 1 && !args[0].startsWith('--')) {
        const projectName = args[0];
        await quickSetup(projectName);
        process.exit(0);
    }

    // 3. Otherwise, enter the interactive questionnaire layout
    await mainSetup();
}

main().catch(console.error);