# ZoneX

**ZoneX** is a lightweight TypeScript library for **parsing and generating DNS zone files** compliant with RFC standards (e.g., RFC 1035). It allows you to convert BIND-style zone files into structured JSON and generate zone files from JSON, supporting a wide variety of DNS record types including SOA, MX, TXT, HINFO, RP, OPENPGPKEY, and more.

---

## Features

* **Structured Metadata Parsing**: Automatically extracts and parses provider-specific tags (like Cloudflare `cf_tags`) from record comments into a structured JSON object.
* Parse BIND zone files into structured JSON objects.
* Generate BIND zone files from JSON records.
* Supports **all common and advanced DNS record types**: A, AAAA, MX, CNAME, NS, TXT, HINFO, SOA, RP, OPENPGPKEY, TLSA, SSHFP, SVCB, URI, and more.
* **Customizable field mapping** — adapt the generator to work with your own JSON property names.
* TypeScript ready with full typings.
* RFC-compliant output for production use.

---

## Installation

```bash
npm install zonex-dns

```

---

## Usage

### Parsing with Provider Metadata

ZoneX now automatically detects and parses structured metadata within comments. For example, Cloudflare uses `cf_tags` to manage record-level settings.

```ts
import { parse } from "zonex-dns";

const zoneData = `
example.com. 3600 IN A 192.0.2.1 ; cf_tags=cf-proxied:true,env:prod
`;

const records = parse(zoneData);
console.log(records[0].comment); 
// Output: { "cf-proxied": "true", "env": "prod" }

```

---

### Output Example (Structured JSON)

```json
{
  "A": [
    {
      "name": "example.com.",
      "ttl": 600,
      "class": "IN",
      "type": "A",
      "rdata": "192.0.2.1",
      "address": "192.0.2.1",
      "comment": {
        "cf-proxied": "true",
        "env": "prod"
      }
    }
  ]
}

```

---

## API Reference

### `DNSRecord` Interface

The core data structure used throughout ZoneX.

```ts
export interface DNSRecord {
    name: string;
    type: RecordType;
    ttl: number;
    class: string;
    rdata: string;
    comment?: Record<string, any>; // Parsed structured metadata
}

```

### `parse(input: string, options?: ParseOptions): DNSRecord[]`

Parses a zone file string into structured JSON.

**Options:**

* `preserveSpacing?: boolean` – keep whitespace formatting in TXT records.
* `keepTrailingDot?: boolean` – retain trailing dot on record names.
* `flatten?: boolean` – flatten records into a single array.

---

## Customizing Field Mapping

By default, ZoneX expects input objects to follow standard DNS record property names. With `fieldMap`, you can map your internal database or API property names to DNS fields.

```ts
generate(records, {
  fieldMap: {
    MX: { priority: "preference" },
    SOA: { retry: "retryInterval" }
  }
});

```

---

## Supported Record Types

A, AAAA, CAA, CNAME, MX, NS, TXT, SRV, PTR, SOA, DS, DNSKEY, TLSA, SSHFP, HTTPS, IPSECKEY, ALIAS, SPF, NAPTR, CERT, LOC, SMIMEA, SVCB, URI, DNAME, HINFO, OPENPGPKEY, RP

---

## Authors & Contributors

* **Deepak K.** – [GitHub](https://github.com/thedeepakcodes)
* **Sandeep K.** – [GitHub](https://github.com/thesandeepcodes)

---

## License

ZoneX is licensed under the **MIT License**.

---