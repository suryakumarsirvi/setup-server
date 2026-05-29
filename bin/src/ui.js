import chalk from 'chalk';

/**
 * Standardized high-fidelity unicode symbols for terminal CLI.
 * No child-like emojis; strictly premium and professional.
 */
export const symbols = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    warning: chalk.yellow('⚠'),
    error: chalk.red('✖'),
    bullet: chalk.dim('•'),
    pointer: chalk.cyan('»'),
    step: chalk.cyan('›'),
    dot: chalk.cyan('●'),
    circle: chalk.dim('○'),
};

/**
 * Creates a horizontal line divider.
 * @param {number} length 
 * @param {boolean} doubleLine 
 * @returns {string}
 */
export const getDivider = (length = 60, doubleLine = false) => {
    const char = doubleLine ? '═' : '─';
    return chalk.dim(char.repeat(length));
};

/**
 * Outputs a horizontal line divider to console.
 * @param {number} length 
 * @param {boolean} doubleLine 
 */
export const printDivider = (length = 60, doubleLine = false) => {
    console.log(getDivider(length, doubleLine));
};

/**
 * Renders a stylized, professional title banner.
 * @param {string} title 
 */
export const printBanner = (title) => {
    const uppercaseTitle = title.toUpperCase();
    console.log('');
    printDivider(60, true);
    console.log(chalk.cyan.bold(`   ${uppercaseTitle}   `));
    printDivider(60, true);
};

/**
 * Standard log formatting utilities.
 */
export const log = {
    step: (msg) => console.log(`\n${symbols.step} ${chalk.cyan.bold(msg)}`),
    info: (msg) => console.log(`${symbols.info} ${chalk.blue(msg)}`),
    success: (msg) => console.log(`${symbols.success} ${chalk.green(msg)}`),
    warn: (msg) => console.log(`${symbols.warning} ${chalk.yellow(msg)}`),
    error: (msg) => console.error(`${symbols.error} ${chalk.red.bold(msg)}`),
    dim: (msg) => console.log(chalk.dim(msg)),
};

/**
 * Helper to display structured details/metrics in lists.
 * @param {string} label 
 * @param {string} value 
 */
export const printDetail = (label, value) => {
    console.log(`  ${symbols.bullet} ${chalk.dim(label.padEnd(16))} ${chalk.white(value)}`);
};
