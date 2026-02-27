import { DNSRecord, ParseOptions, RecordType } from "../types/parser.types";

export const DEFAULT_TTL = "3600";
export const DnsTypes = [
    "A",
    "AAAA",
    "CAA",
    "CNAME",
    "MX",
    "NS",
    "TXT",
    "SRV",
    "PTR",
    "SOA",
    "DS",
    "DNSKEY",
    "TLSA",
    "SSHFP",
    "HTTPS",
    "IPSECKEY",
    "ALIAS",
    "SPF",
    "NAPTR",
    "CERT",
    "LOC",
    "SMIMEA",
    "SVCB",
    "URI",
    "DNAME",
    "HINFO",
    "OPENPGPKEY",
    "RP"
];

export interface SanatizedRecord {
    rawRecord: string;
    comment: string;
}

export const sanitize = (input: string): SanatizedRecord[] => {
    const records: SanatizedRecord[] = [];
    let buffer = "";

    const lines = input.split(/\r?\n/);

    for (let line of lines) {

        if (!line || line.startsWith(";")) continue;

        const { rawRecord, comment } = removeRecordComments(line)

        line = rawRecord;

        if (line.includes("(") && !line.includes(")")) {
            buffer += line.replace("(", "").trim() + " ";
            continue;
        }

        if (line.includes(")")) {
            buffer += line.replace(")", "").trim();
            records.push({
                rawRecord: buffer.trim(),
                comment
            });

            buffer = "";
            continue;
        }

        if (buffer) {
            buffer += line + " ";
            continue;
        }

        records.push({
            rawRecord: line,
            comment
        });
    }

    return records.map(r => ({
        rawRecord: r.rawRecord.replace(/\t/g, " "),
        comment: r.comment
    }));
};

const removeRecordComments = (line: string): SanatizedRecord => {
    let record = "";

    let insideQuotes = false;
    let comment = "";

    if (!line.includes(";")) return { rawRecord: line, comment };

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const isEscaped = i > 0 && line[i - 1] === "\\";

        if (!insideQuotes && char === ";") {
            comment = line.slice(i + 1).trim();
            break;
        }

        record += char;

        if (char === '"' && !isEscaped) {
            insideQuotes = !insideQuotes;
            continue;
        }
    }

    return { rawRecord: record, comment };
}

export const extractRawRecords = (sanatizedRecords: SanatizedRecord[], options?: ParseOptions): { records: DNSRecord[], origin: string, ttl: number } => {
    const { preserveSpacing, keepTrailingDot } = {
        preserveSpacing: true,
        keepTrailingDot: true,
        ...options,
    };

    const parsedRecords: DNSRecord[] = [];
    const VALID_CLASSES = ["IN", "CH", "CS", "HS"];

    let origin: string = "";
    let currentOrigin: string | undefined;
    let originTTL: string | undefined;

    for (const sanatizedRecord of sanatizedRecords) {
        const { rawRecord, comment } = sanatizedRecord;

        if (rawRecord.startsWith("$")) {
            const directive = rawRecord.trim().toLowerCase();

            if (directive.startsWith("$origin")) {
                currentOrigin = directive.split(" ")[1];
                origin = currentOrigin;
            }
            if (directive.startsWith("$ttl")) {
                originTTL = directive.split(" ")[1];
            }

            continue;
        }

        const dnsRecord = {
            name: "",
            ttl: "",
            class: "",
            type: "",
            rdata: "",
        };

        let insideQuotes = false;
        let reconstructed = "";

        for (let i = rawRecord.length - 1; i >= 0; i--) {
            const char = rawRecord[i];
            const isEscaped = i > 0 && rawRecord[i - 1] === "\\";

            if (char === '"' && !isEscaped) {
                insideQuotes = !insideQuotes;
                continue;
            }

            if (!insideQuotes) {
                reconstructed = char + reconstructed;
            } else {
                reconstructed = "";
            }
        }

        /**
         * Append a trailing space to the record string
         * So that type is always followed by a whitespace character.
         */

        reconstructed += " ";

        const typeRegex = new RegExp(`(?:\\s|^)(${DnsTypes.join("|")})(?=\\s)`, "gmi");
        const recordType = reconstructed.match(typeRegex)?.pop() ?? "";
        const typeIndex = reconstructed.lastIndexOf(recordType);

        const parts = [
            rawRecord.slice(0, typeIndex),
            recordType,
            rawRecord.slice(typeIndex + recordType.length).trim()
        ];


        if (parts.length === 3) {
            dnsRecord.rdata = parts.pop()?.trim() ?? "";
            dnsRecord.type = parts.pop()?.trim() ?? "";
            const tokens = (parts[0]?.split(" ") ?? []).reverse();
            const inheritOwnerName = tokens[tokens.length - 1] === "";
            const [first, second, third] = tokens.filter(Boolean);

            const setDefaults = () => {
                dnsRecord.ttl = originTTL ?? DEFAULT_TTL;
                dnsRecord.class = "IN";
                dnsRecord.name = currentOrigin ?? "@";
            };

            const isValidClass = (value: string | undefined) =>
                value ? VALID_CLASSES.includes(value.toUpperCase()) : false;

            const assignRecord = (
                ttl: string | undefined,
                recordClass: string | undefined,
                name: string | undefined
            ) => {
                dnsRecord.ttl = ttl ?? originTTL ?? DEFAULT_TTL;
                dnsRecord.class = recordClass ?? "IN";
                dnsRecord.name = name ?? currentOrigin ?? "@";
            };

            if (!first && !second && !third) {
                setDefaults();
            } else if (first && !second && !third) {
                if (isValidClass(first)) {
                    assignRecord(originTTL, inheritOwnerName ? first : "IN", inheritOwnerName ? currentOrigin : first);
                } else {
                    assignRecord(inheritOwnerName ? first : originTTL, "IN", inheritOwnerName ? currentOrigin : first);
                }
            } else if (first && second && !third) {
                if (isValidClass(first)) {
                    assignRecord(inheritOwnerName ? second : originTTL, first, inheritOwnerName ? currentOrigin : second);
                } else {
                    assignRecord(first, inheritOwnerName ? second : "IN", inheritOwnerName ? currentOrigin : second);
                }
            } else if (first && second && third) {
                if (isValidClass(first)) {
                    assignRecord(second, first, third);
                } else {
                    assignRecord(first, second, third);
                }
            }

            currentOrigin = dnsRecord.name;

            if (!origin && dnsRecord.type === "SOA") {
                if (dnsRecord.name.endsWith(".")) {
                    dnsRecord.name = dnsRecord.name.slice(0, -1);
                }

                origin = dnsRecord.name + ".";
            }

            // complete relative domains
            let recordName = dnsRecord.name.replace("@", origin ?? "");
            if (dnsRecord.type !== "SOA") {
                recordName = toFqdn(recordName, origin ?? "", keepTrailingDot);
            }

            // cname records can have relative domains
            if (dnsRecord.type === "CNAME") {
                dnsRecord.rdata = dnsRecord.rdata.replace("@", origin ?? "");
                dnsRecord.rdata = toFqdn(dnsRecord.rdata, origin ?? "", keepTrailingDot);
            }

            // remove spaces from non-TXT records
            if (dnsRecord.type !== "TXT") {
                dnsRecord.rdata = dnsRecord.rdata.replace(/\s+/g, " ");
            }

            // remove quotes from TXT records :::: Added SPF just to support old zone files
            if (dnsRecord.type === "TXT" || dnsRecord.type === "SPF") {
                const matches = dnsRecord.rdata.match(/"((?:[^"\\]|\\.)*)"/g);
                const joinBy = preserveSpacing ? " " : "";

                dnsRecord.rdata = matches?.map(s => s.slice(1, -1)).join(joinBy) ?? '';
            }

            const parsed = parseComment(comment);

            parsedRecords.push({
                ...dnsRecord,
                type: dnsRecord.type as RecordType,
                name: recordName.toLowerCase(),
                ttl: normalizeTtl(dnsRecord.ttl),
                comment: parsed.comment ?? undefined,
                meta: parsed.meta ?? undefined,
            });
        }
    }

    return { records: parsedRecords, origin, ttl: normalizeTtl(originTTL) };
}

const parseComment = (comment: string): { meta: Record<string, any> | null, comment: string | null } => {
    let cleanComment = null;
    let meta: Record<string, any> | null = null;

    const cfTagsRegex = /cf_tags=([^\s]+)/i;
    const match = comment.trim().match(cfTagsRegex);

    if (match) {
        const rawPayload = match[1];
        const parsed: Record<string, any> = {};
        const pairs = rawPayload.split(",");

        for (const pair of pairs) {
            const [key, value] = pair.split(":");
            if (key && value) {
                parsed[key.trim().toLowerCase()] = value.trim().toLowerCase();
            }
        }

        if (Object.keys(parsed).length > 0) {
            meta = parsed;
        }

        cleanComment = comment.trim().replace(cfTagsRegex, "").replace(/\s+/g, " ").trim();
    }

    return { meta, comment: cleanComment };
}

export const normalizeTtl = (ttl: string | number | undefined): number => {
    if (!ttl) return parseInt(DEFAULT_TTL);

    if (typeof ttl === "number") return ttl;

    const digits = /\d+(\.\d+)?/;

    if (digits.test(ttl) && /^\d+$/.test(ttl)) return parseInt(ttl, 10);

    const units: Record<string, number> = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
        w: 604800,
    };

    const trimmed = ttl.trim().toLowerCase();
    const unit = trimmed.slice(-1);
    const numPart = parseFloat(trimmed.slice(0, -1));

    if (!units[unit] || isNaN(numPart)) return parseInt(DEFAULT_TTL);

    return numPart * units[unit];
};

export const toFqdn = (name: string, origin: string, keepTrailingDot?: boolean) => {
    const fqdn = name.endsWith(".")
        ? name
        : name + "." + origin;

    return keepTrailingDot ? fqdn : fqdn.slice(0, -1);
};