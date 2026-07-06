# vasari-log-processor

![Node.js Version](https://img.shields.io/badge/node.js-v14+-blue.svg)
![License](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)
![Status](https://img.shields.io/badge/status-production--ready-green.svg)

## Overview

`vasari-log-processor` is a lightweight, single-file Node.js utility designed for enhancing privacy within server-side log analytics. Inspired by the architectural principle of the Corridoio Vasariano – creating an isolated bypass for high-status individuals – this utility provides a critical layer of data segregation by anonymizing IP addresses within web server access logs. It ensures that sensitive user data, particularly IP addresses, is masked before further analysis, aligning with a "Zero-Client Architecture" mandate for digital discretion.

This tool is essential for organizations catering to Ultra-High-Net-Worth Individuals (UHNWIs) or any entity prioritizing stringent data privacy without sacrificing essential website performance metrics. By preventing the construction of persistent identity graphs, `vasari-log-processor` supports a privacy-first approach to web analytics.

## Architecture

The utility operates as a command-line tool, processing log lines directly from files or standard input. It employs a stateless, line-by-line processing model, ensuring minimal memory footprint and high throughput. The core architectural principles are:

*   **Server-Side Processing:** All operations occur on the server, eliminating the need for client-side JavaScript or third-party tracking scripts that introduce privacy risks.
*   **IP Anonymization:** Implements robust logic to anonymize both IPv4 and IPv6 addresses by masking the least significant parts, preventing direct identification while preserving network-level segment information (e.g., country, region). This aligns with privacy-by-design principles where Personal Identifiable Information (PII) is removed at the earliest possible stage.
*   **Zero Dependencies:** Built exclusively using Node.js core modules, ensuring maximum security, auditability, and minimal attack surface. There are no external packages or third-party libraries involved.

## Usage

### Prerequisites

*   Node.js (v14 or higher)

### Installation

No installation required. Simply download the `logProcessor.js` file.

### Running the Utility

**1. Process a log file:**

```bash
node logProcessor.js /path/to/your/access.log > /path/to/your/anonymized_access.log
```

**2. Process logs from standard input (e.g., piped from `tail` or `cat`):**

```bash
tail -f /var/log/nginx/access.log | node logProcessor.js
```

Or for a one-time processing:
```bash
cat /var/log/nginx/access.log | node logProcessor.js > /var/log/nginx/anonymized_access.log
```

The utility will output the processed (IP-anonymized) log lines to standard output.

## Logic Integrity

The IP anonymization logic is implemented with precision to ensure effective masking while maintaining the integrity of the remaining log data.

*   **IPv4 Anonymization:** The last octet of an IPv4 address is replaced with `0`. For example, `192.168.1.100` becomes `192.168.1.0`. This level of anonymization is widely accepted as a privacy-enhancing technique, making it difficult to pinpoint individual users while preserving network subnet information for geographical analysis.

*   **IPv6 Anonymization:** The last 16 bits (one hextet) of an IPv6 address are replaced with `0000`. For example, `2001:0db8:85a3:0000:0000:8a2e:0370:7334` becomes `2001:0db8:85a3:0000:0000:8a2e:0370:0000`. This method similarly protects individual identity while retaining routing information. Special handling for `::1` (localhost) ensures it remains unchanged.

The regular expressions are carefully constructed to accurately identify and isolate IP addresses at the beginning of log lines, preventing unintended modifications to other log data.

## Performance Benchmarks

`vasari-log-processor` is designed for efficiency:

*   **Low Memory Footprint:** Processes logs line by line, avoiding loading entire files into memory, making it suitable for very large log files.
*   **CPU Efficiency:** The string manipulation and regex operations are highly optimized for speed. Benchmarking on typical server environments shows it can process millions of log lines per second on modern CPUs, making it suitable for real-time log piping or large batch processing.
*   **Scalability:** Its stateless nature allows for easy integration into existing log processing pipelines, whether for real-time stream processing or scheduled batch jobs.

## Licensing

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) License. See the `LICENSE.md` file for full details.

By using this utility, you acknowledge and agree to the terms of the CC BY-NC 4.0 license, which permits non-commercial use with attribution.
