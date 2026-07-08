const fs = require('fs');
const { Transform, pipeline } = require('stream');
const { promisify } = require('util');
const readline = require('readline');

const pipelineAsync = promisify(pipeline);

/**
 * Validated IPv4 Pattern: Matches 0-255 octets specifically.
 */
const IPV4_PATTERN = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

/**
 * Comprehensive IPv6 Pattern: Handles standard, compressed, and dual formats.
 */
const IPV6_PATTERN = /\b(?:[a-fA-F0-9]{1,4}:){1,7}(?:[a-fA-F0-9]{1,4}|:)|(?::(?::[a-fA-F0-9]{1,4}){1,7})\b/g;

/**
 * Masks the last octet of an IPv4 address.
 */
function anonymizeIpv4(ip) {
    return ip.substring(0, ip.lastIndexOf('.')) + '.0';
}

/**
 * Masks the last segment of an IPv6 address.
 */
function anonymizeIpv6(ip) {
    if (ip === '::1' || ip === '::') return ip;
    const lastColon = ip.lastIndexOf(':');
    if (lastColon === -1) return ip;
    return ip.substring(0, lastColon) + ':0000';
}

/**
 * High-performance Transform implementation
 */
class Anonymizer extends Transform {
    constructor(options) {
        super(options);
    }

    _transform(line, encoding, callback) {
        // Line is provided as a string via readline interface
        const processed = line.toString()
            .replace(IPV4_PATTERN, anonymizeIpv4)
            .replace(IPV6_PATTERN, anonymizeIpv6);
        
        this.push(processed + '\n');
        callback();
    }
}

async function run(filePath) {
    const input = filePath ? fs.createReadStream(filePath) : process.stdin;
    const output = process.stdout;

    if (filePath && !fs.existsSync(filePath)) {
        console.error(`[ERROR] File not found: ${filePath}`);
        process.exit(1);
    }

    console.error(`[INFO] Processing ${filePath || 'stdin'}...`);

    try {
        const rl = readline.createInterface({
            input: input,
            terminal: false
        });

        const anonymizer = new Anonymizer();

        // pipeline handles backpressure and error propagation automatically
        await pipelineAsync(
            rl,
            anonymizer,
            output
        );
        
        console.error("[SUCCESS] Processing complete.");
    } catch (err) {
        console.error(`[FATAL] ${err.message}`);
        process.exit(1);
    }
}

// Execution block
const args = process.argv.slice(2);
run(args[0]).catch(err => {
    console.error(err);
    process.exit(1);
});
