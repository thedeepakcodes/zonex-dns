export enum RecordType {
    A = "A",
    AAAA = "AAAA",
    CNAME = "CNAME",
    NS = "NS",
    TXT = "TXT",
    MX = "MX",
    PTR = "PTR",
    SOA = "SOA",
    SRV = "SRV",
    CAA = "CAA",
    SPF = "SPF",
    LOC = "LOC",
    DS = "DS",
    DNSKEY = "DNSKEY",
    TLSA = "TLSA",
    SSHFP = "SSHFP",
    HTTPS = "HTTPS",
    IPSECKEY = "IPSECKEY",
    ALIAS = "ALIAS",
    NAPTR = "NAPTR",
    CERT = "CERT",
    SMIMEA = "SMIMEA",
    SVCB = "SVCB",
    URI = "URI",
    DNAME = "DNAME",
    HINFO = "HINFO",
    OPENPGPKEY = "OPENPGPKEY",
    RP = "RP",
}

export interface DNSRecord {
    name: string;
    type: RecordType;
    ttl: number;
    class: string;
    rdata: string;
    comment?: Record<string, any>;
}

export interface ARecord extends DNSRecord {
    type: RecordType.A;
    address: string;
}

export interface AAAARecord extends DNSRecord {
    type: RecordType.AAAA;
    address: string;
}

export interface CNAMERecord extends DNSRecord {
    type: RecordType.CNAME;
    target: string;
}

export interface NSRecord extends DNSRecord {
    type: RecordType.NS;
    host: string;
}

export interface TXTRecord extends DNSRecord {
    type: RecordType.TXT;
    text: string;
}

export interface MXRecord extends DNSRecord {
    type: RecordType.MX;
    priority: number;
    exchange: string;
}

export interface PTRRecord extends DNSRecord {
    type: RecordType.PTR;
    ptrdname: string;
}

export interface SOARecord extends DNSRecord {
    type: RecordType.SOA;
    mname: string;
    rname: string;
    serial: number;
    refresh: number;
    retry: number;
    expire: number;
    minimum: number;
}

export interface SRVRecord extends DNSRecord {
    type: RecordType.SRV;
    priority: number;
    weight: number;
    port: number;
    target: string;
}

export interface CAARecord extends DNSRecord {
    type: RecordType.CAA;
    flag: number;
    tag: string;
    value: string;
}

export interface SPFRecord extends DNSRecord {
    type: RecordType.SPF;
    text: string;
}

export interface DMS {
    degrees: number;
    minutes: number;
    seconds: number;
    hemisphere: string;
}

export interface LOCRecord extends DNSRecord {
    type: RecordType.LOC;
    latitude: DMS;
    longitude: DMS;
    altitude: number;
    size: number;
    horizPrecision: number;
    vertPrecision: number;
}

export interface DSRecord extends DNSRecord {
    type: RecordType.DS;
    keyTag: number;
    algorithm: number;
    digestType: number;
    digest: string;
}

export interface DNSKEYRecord extends DNSRecord {
    type: RecordType.DNSKEY;
    flags: number;
    protocol: number;
    algorithm: number;
    publicKey: string;
}

export interface TLSARecord extends DNSRecord {
    type: RecordType.TLSA;
    usage: number;
    selector: number;
    matchingType: number;
    certificateAssociationData: string;
}

export interface SSHFPRecord extends DNSRecord {
    type: RecordType.SSHFP;
    algorithm: number;
    fingerprintType: number;
    fingerprint: string;
}

export interface HTTPSRecord extends DNSRecord {
    type: RecordType.HTTPS;
    priority: number;
    target: string;
    params: string;
}

export interface IPSECKEYRecord extends DNSRecord {
    type: RecordType.IPSECKEY;
    precedence: number;
    gatewayType: number;
    algorithm: number;
    gateway: string;
    publicKey: string;
}

export interface ALIASRecord extends DNSRecord {
    type: RecordType.ALIAS;
    target: string;
}

export interface NAPTRRecord extends DNSRecord {
    type: RecordType.NAPTR;
    order: number;
    preference: number;
    flags: string;
    service: string;
    regexp: string;
    replacement: string;
}

export interface CERTRecord extends DNSRecord {
    type: RecordType.CERT;
    certType: number;
    keyTag: number;
    algorithm: number;
    certificate: string;
}

export interface SMIMEARecord extends DNSRecord {
    type: RecordType.SMIMEA;
    usage: number;
    selector: number;
    matchingType: number;
    certAssociationData: string;
}

export interface SVCBRecord extends DNSRecord {
    type: RecordType.SVCB;
    priority: number;
    target: string;
    params: string;
}

export interface URIRecord extends DNSRecord {
    type: RecordType.URI;
    priority: number;
    weight: number;
    target: string;
}

export interface DNAMERecord extends DNSRecord {
    type: RecordType.DNAME;
    target: string;
}

export interface HINFORecord extends DNSRecord {
    type: RecordType.HINFO;
    cpu: string;
    os: string;
}

export interface OPENPGPKEYRecord extends DNSRecord {
    type: RecordType.OPENPGPKEY;
    publicKey: string;
}

export interface RPRecord extends DNSRecord {
    type: RecordType.RP;
    mailbox: string;
    txtDomain: string;
}

export type ParsedRecord =
    | ARecord
    | AAAARecord
    | CNAMERecord
    | NSRecord
    | TXTRecord
    | MXRecord
    | PTRRecord
    | SOARecord
    | SRVRecord
    | CAARecord
    | SPFRecord
    | LOCRecord
    | DSRecord
    | DNSKEYRecord
    | TLSARecord
    | SSHFPRecord
    | HTTPSRecord
    | IPSECKEYRecord
    | ALIASRecord
    | NAPTRRecord
    | CERTRecord
    | SMIMEARecord
    | SVCBRecord
    | URIRecord
    | DNAMERecord
    | HINFORecord
    | OPENPGPKEYRecord
    | RPRecord;

export interface ParseOptions {
    preserveSpacing?: boolean;
    keepTrailingDot?: boolean;
    flatten?: boolean;
}

export type DNSRecordsByType = {
    [key: string]: DNSRecord[];
};

export type ParsedRecordByType = {
    [T in RecordType]: Extract<ParsedRecord, { type: T }>[];
};