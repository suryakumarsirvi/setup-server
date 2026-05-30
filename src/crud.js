import path from 'path';
import fs from 'fs-extra';
import { intro, outro, spinner } from '@clack/prompts';
import chalk from 'chalk';
import { symbols } from './ui.js';

/**
 * Automates the generation of a full CRUD feature layer (routes, controller, validator) 
 * by parsing an existing Mongoose model file.
 * @param {string} modelName 
 */
export async function generateCRUD(modelName) {
    intro(chalk.bgMagenta.black(` CRUD API Generator: ${modelName} `));

    const s = spinner();

    // Verify workspace layout contains src/models
    if (!fs.existsSync('src') || !fs.existsSync('src/models')) {
        outro(chalk.red('Error: Not inside a valid setup-server project directory. Ensure src/models/ exists.'));
        process.exit(1);
    }

    // Auto-detect TypeScript or JavaScript settings
    const isTS = fs.existsSync('tsconfig.json') || 
                 (fs.existsSync('src/models') && fs.readdirSync('src/models').some(f => f.endsWith('.ts')));
    const ext = isTS ? 'ts' : 'js';

    s.start(`Scanning models folder for [${modelName}] schema...`);

    // Check potential file naming conventions
    const modelPath = path.join('src', 'models', `${modelName}.${ext}`);
    const modelPathAlt = path.join('src', 'models', `${modelName}.model.${ext}`);
    const modelPathSchema = path.join('src', 'models', `${modelName}.schema.${ext}`);

    let finalModelPath = null;
    if (fs.existsSync(modelPath)) finalModelPath = modelPath;
    else if (fs.existsSync(modelPathAlt)) finalModelPath = modelPathAlt;
    else if (fs.existsSync(modelPathSchema)) finalModelPath = modelPathSchema;

    if (!finalModelPath) {
        s.stop('Model schema search finished.');
        outro(chalk.red(`Error: Model schema file "${modelName}" not found in src/models/`));
        process.exit(1);
    }

    s.stop('Model file localized.');

    // Parse model parameters and fields
    const modelContent = await fs.readFile(finalModelPath, 'utf-8');
    const schemaFields = extractSchemaFields(modelContent);

    s.start('Compiling REST API controller code...');
    const controllerContent = generateControllerContent(modelName, schemaFields, isTS);
    await fs.ensureDir('src/controllers');
    const controllerPath = path.join('src', 'controllers', `${modelName}.controller.${ext}`);
    await fs.writeFile(controllerPath, controllerContent);
    s.stop('REST controller successfully generated.');

    s.start('Compiling express endpoint routes...');
    const routeContent = generateRouteContent(modelName, isTS);
    await fs.ensureDir('src/routes');
    const routePath = path.join('src', 'routes', `${modelName}.routes.${ext}`);
    await fs.writeFile(routePath, routeContent);
    s.stop('Routes configuration successfully compiled.');

    // Optional Zod validator output
    const packageJson = fs.existsSync('package.json') ? await fs.readJSON('package.json') : {};
    let isZodGenerated = false;

    if (packageJson.dependencies?.zod) {
        s.start('Compiling request validator schema...');
        const validationContent = generateValidationContent(modelName, schemaFields, isTS);
        await fs.ensureDir('src/validators');
        const validationPath = path.join('src', 'validators', `${modelName}.validator.${ext}`);
        await fs.writeFile(validationPath, validationContent);
        s.stop('Zod validation schemes prepared.');
        isZodGenerated = true;
    }

    // Professional output detailing completed modules
    const details = [
        `  ${symbols.success} Controller:   src/controllers/${modelName}.controller.${ext}`,
        `  ${symbols.success} Endpoints:    src/routes/${modelName}.routes.${ext}`,
        isZodGenerated ? `  ${symbols.success} Validator:    src/validators/${modelName}.validator.${ext}` : ''
    ].filter(Boolean).join('\n');

    outro(`${chalk.green.bold('Success: CRUD lifecycle elements created.')}

${chalk.cyan('Generated modules:')}
${details}

${chalk.cyan('Next steps:')}
  ${symbols.pointer} Register routes within your core Express app configuration.
  ${symbols.pointer} Example: app.use('/api/${modelName.toLowerCase()}', ${modelName}Routes);
`);
}

/**
 * Parses mongoose schema fields from file string.
 * @param {string} modelContent 
 * @returns {Array}
 */
export function extractSchemaFields(modelContent) {
    const fields = [];
    const schemaRegex = /(\w+):\s*{\s*type:\s*([^,}]+)(?:,\s*required:\s*([^,}]+))?(?:,\s*default:\s*([^,}]+))?(?:,\s*select:\s*([^,}]+))?(?:,\s*unique:\s*([^,}]+))?(?:,\s*enum:\s*\[([^\]]+)\])?[^}]*}/g;

    let match;
    while ((match = schemaRegex.exec(modelContent)) !== null) {
        const fieldName = match[1];
        const fieldType = match[2].trim();
        const required = match[3] === 'true' || match[3] === 'false' ? match[3] === 'true' : false;
        const defaultValue = match[4] ? match[4].trim() : null;
        const select = match[5] === 'true' || match[5] === 'false' ? match[5] === 'true' : true;
        const unique = match[6] === 'true' || match[6] === 'false' ? match[6] === 'true' : false;
        const enumValues = match[7] ? match[7].split(',').map(v => v.trim().replace(/['"]/g, '')) : null;

        fields.push({
            name: fieldName,
            type: fieldType,
            required,
            default: defaultValue,
            select,
            unique,
            enum: enumValues
        });
    }

    return fields;
}

/**
 * Produces controller operations template.
 */
export function generateControllerContent(modelName, fields, isTS) {
    const capitalizedName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const lowerModelName = modelName.toLowerCase();

    const imports = `import ${capitalizedName} from '../models/${modelName}${isTS ? '.js' : ''}';${isTS ? `
import { Request, Response, NextFunction } from 'express';` : ''}`;

    const typeAnnotation = isTS ? ': Request, res: Response, next: NextFunction' : '';

    return `${imports}

// @desc    Create new ${lowerModelName}
// @route   POST /api/${lowerModelName}
// @access  Public
export const create${capitalizedName} = async (req${typeAnnotation}) => {
    try {
        const new${capitalizedName} = new ${capitalizedName}(req.body);
        const saved${capitalizedName} = await new${capitalizedName}.save();
        res.status(201).json({
            success: true,
            data: saved${capitalizedName}
        });
    } catch (error${isTS ? ': any' : ''}) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all ${lowerModelName}s
// @route   GET /api/${lowerModelName}
// @access  Public
export const getAll${capitalizedName}s = async (req${typeAnnotation}) => {
    try {
        const page = parseInt(req.query.page${isTS ? ' as string' : ''}) || 1;
        const limit = parseInt(req.query.limit${isTS ? ' as string' : ''}) || 10;
        const skip = (page - 1) * limit;
        
        const ${lowerModelName}s = await ${capitalizedName}.find()
            .select(${fields.filter(f => f.select).map(f => `'${f.name}'`).join(' ') || "'__v'"})
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
            
        const total = await ${capitalizedName}.countDocuments();
        
        res.status(200).json({
            success: true,
            data: ${lowerModelName}s,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error${isTS ? ': any' : ''}) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get ${lowerModelName} by ID
// @route   GET /api/${lowerModelName}/:id
// @access  Public
export const get${capitalizedName}ById = async (req${typeAnnotation}) => {
    try {
        const ${lowerModelName} = await ${capitalizedName}.findById(req.params.id);
        
        if (!${lowerModelName}) {
            return res.status(404).json({
                success: false,
                message: '${capitalizedName} not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: ${lowerModelName}
        });
    } catch (error${isTS ? ': any' : ''}) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update ${lowerModelName}
// @route   PUT /api/${lowerModelName}/:id
// @access  Public
export const update${capitalizedName} = async (req${typeAnnotation}) => {
    try {
        const ${lowerModelName} = await ${capitalizedName}.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!${lowerModelName}) {
            return res.status(404).json({
                success: false,
                message: '${capitalizedName} not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: ${lowerModelName}
        });
    } catch (error${isTS ? ': any' : ''}) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete ${lowerModelName}
// @route   DELETE /api/${lowerModelName}/:id
// @access  Public
export const delete${capitalizedName} = async (req${typeAnnotation}) => {
    try {
        const ${lowerModelName} = await ${capitalizedName}.findByIdAndDelete(req.params.id);
        
        if (!${lowerModelName}) {
            return res.status(404).json({
                success: false,
                message: '${capitalizedName} not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: '${capitalizedName} deleted successfully'
        });
    } catch (error${isTS ? ': any' : ''}) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
`;
}

/**
 * Produces endpoint routing configuration template.
 */
export function generateRouteContent(modelName, isTS) {
    const capitalizedName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

    const imports = `import express from 'express';
import { 
    create${capitalizedName},
    getAll${capitalizedName}s,
    get${capitalizedName}ById,
    update${capitalizedName},
    delete${capitalizedName}
} from '../controllers/${modelName}.controller${isTS ? '.js' : ''}';${isTS ? `
import { Request, Response, NextFunction } from 'express';` : ''}`;

    return `${imports}

const router = express.Router();

router.post('/', create${capitalizedName});
router.get('/', getAll${capitalizedName}s);
router.get('/:id', get${capitalizedName}ById);
router.put('/:id', update${capitalizedName});
router.delete('/:id', delete${capitalizedName});

export default router;
`;
}

/**
 * Produces Zod request validator schema definitions.
 */
export function generateValidationContent(modelName, fields, isTS) {
    const capitalizedName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

    let validationFields = '';

    fields.forEach(field => {
        let fieldValidation = `  ${field.name}: z`;

        switch (field.type) {
            case 'String':
                fieldValidation += '.string()';
                if (field.required) fieldValidation += '.min(1)';
                break;
            case 'Number':
                fieldValidation += '.number()';
                break;
            case 'Boolean':
                fieldValidation += '.boolean()';
                break;
            case 'Date':
                fieldValidation += '.date()';
                break;
            case 'Array':
                fieldValidation += '.array()';
                break;
            case 'Object':
                fieldValidation += '.object({})';
                break;
            default:
                fieldValidation += '.any()';
        }

        if (field.enum) {
            fieldValidation += `.enum([${field.enum.map(v => `'${v}'`).join(', ')}])`;
        }

        if (!field.required) {
            fieldValidation += '.optional()';
        }

        if (field.default && field.default !== 'null') {
            fieldValidation += `.default(${field.default})`;
        }

        validationFields += fieldValidation + ',\n';
    });

    return `import { z } from 'zod';

export const create${capitalizedName}Schema = z.object({
${validationFields}
});

export const update${capitalizedName}Schema = z.object({
${validationFields}
}).partial();

export const ${modelName}IdSchema = z.object({
    id: z.string().min(1, 'ID is required')
});

export type Create${capitalizedName}Input = z.infer<typeof create${capitalizedName}Schema>;
export type Update${capitalizedName}Input = z.infer<typeof update${capitalizedName}Schema>;
`;
}
