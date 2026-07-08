const fs = require('fs');
const { Transform, pipeline } = require('stream');
const { promisify } = require('util');
const readline = require('readline');

const pipelineAsync = promisify(pipeline);

/**
 * Robust Regex for IP detection.
 * IPv4: Standard 4 octets.
 * IPv6: Simple hex/colon detection (refined for masking logic).
 */
const IPV4_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const IPV6_PATTERN = /\b(?:[0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}\b|\b::1\b/g;

/**
 * Mask the last octet of an IPv4 address.
 */
function anonymizeIpv4(ip) {
    return ip.replace(/\.\d+$/, '.0');
}

/**
 * Mask the last segment of an IPv6 address.
 */
function anonymizeIpv6(ip) {
    if (ip === '::1') return ip;
    // Replace the last hex block with zeros
    return ip.replace(/:[0-9a-fA-F]{1,4}$/, ':0000');
}

/**
 * Main Transform Stream logic.
 */
class AnonymizerStream extends Transform {
    _transform(chunk, encoding, callback) {
        let line = chunk.toString();
        
        // Process IPv4
        line = line.replace(IPV4_PATTERN, (match) => anonymizeIpv4(match));
        
        // Process IPv6
        line = line.replace(IPV6_PATTERN, (match) => anonymizeIpv6(match));
        
        this.push(line + '\n');
        callback();
    }
}

async function run(filePath) {
    const input = filePath ? fs.createReadStream(filePath) : process.stdin;
    const output = process.stdout;

    console.error(`[INFO] Starting processing: ${filePath || 'stdin'}`);

    try {
        // We use readline interface to handle line-by-line chunks correctly
        const rl = readline.createInterface({
            input: input,
            terminal: false
        });

        const anonymizer = new Transform({
            transform(line, encoding, callback) {
                let processed = line.toString();
                processed = processed.replace(IPV4_PATTERN, anonymizeIpv4);
                processed = processed.replace(IPV6_PATTERN, anonymizeIpv6);
                callback(null, processed + '\n');
            }
        });

        await pipelineAsync(
            rl,
            anonymizer,
            output
        );
        
        console.error("[SUCCESS] Log processing complete.");
    } catch (err) {
        console.error(`[ERROR] Processing failed: ${err.message}`);
        process.exit(1);
    }
}

// Entry Point
const args = process.argv.slice(2);
run(args[0]).catch(err => {
    console.error(err);
    process.exit(1);
});
