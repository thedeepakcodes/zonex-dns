import { ParsedRecord, ParsedRecordByType, ParseOptions, RecordType } from "./types/parser.types";
import { extractRawRecords, sanitize } from "./utils/parser.helper";
import * as parser from "./utils/records.parser";


/**
 * Parse a BIND-style zone file into structured JSON records.
 * @param {string} input - BIND-style zone file contents.
 * @param {ParseOptions} [options] - Optional parsing options.
 *  
 * @returns {ParsedRecordByType | ParsedRecord[]} Parsed DNS records in either grouped or flattened format.
 * 
 * @example 
 * 
 * const records = parse(input);
 * 
 */

export function parse(
    input: string,
    options?: Omit<ParseOptions, "flatten"> & { flatten?: false }
): ParsedRecordByType;


export function parse(
    input: string,
    options: Omit<ParseOptions, "flatten"> & { flatten: true }
): ParsedRecord[];

export function parse(input: string, options?: ParseOptions): ParsedRecordByType | ParsedRecord[] {
    const records = sanitize(input);

    const { records: dnsRecords } = extractRawRecords(records, options);

    const { flatten } = options || {
        flatten: false,
    };

    const groupedRecords: ParsedRecordByType = Object.values(RecordType).reduce((acc, type) => {
        return acc;
    }, {} as ParsedRecordByType);


    dnsRecords.forEach((dnsRecord) => {
        const type = dnsRecord.type.toUpperCase() as RecordType;

        const parsedRecord = parser.recordParsers[type](dnsRecord);

        if (!groupedRecords[type]) {
            groupedRecords[type] = [];
        }

        groupedRecords[type].push(parsedRecord as any);
    });

    return flatten ? Object.values(groupedRecords).flat() : groupedRecords;
};
