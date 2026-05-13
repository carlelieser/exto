# exto

A CLI tool for scraping torrent links from [ext.to](https://ext.to). Uses headless browser automation with Cloudflare
bypass.

## Quick Start

```bash
git clone https://github.com/carlelieser/exto.git
cd exto
npm install
npm run build
npm link
```

## Usage

```bash
exto [options]
# or without linking:
node dist/index.js [options]
# or during development:
npm run dev -- [options]
```

### Required Options

| Option     | Description       | Example                 |
|------------|-------------------|-------------------------|
| `--id`     | Show ID slug      | `the-office-s3393`      |
| `--res`    | Resolution filter | `1080p`, `720p`, `480p` |
| `--season` | Season number     | `9`                     |

### Optional Options

| Option                     | Description                                  | Default             |
|----------------------------|----------------------------------------------|---------------------|
| `--start` (or `--episode`) | Starting episode number                      | `1`                 |
| `--end`                    | Ending episode number                        | same as start       |
| `--label`                  | Regex filter for torrent labels              | none                |
| `--limit`                  | Max results per episode                      | none                |
| `--format`                 | Output format: `json`, `csv`, `raw`          | `json`              |
| `--extract`                | Fields to extract: `label`, `href`, `magnet` | `label,href,magnet` |
| `--out`                    | Output file path                             | none                |
| `--dump`                   | Print results to stdout                      | `false`             |
| `--concurrency`            | Parallel episode processing                  | `1`                 |
| `--headless`               | Run browser in headless mode                 | `false`             |

### Examples

**Scrape all Superfan episode links from Amazon for The Office S9:**

```bash
exto \
  --id the-office-s3393 \
  --res 1080p \
  --season 9 \
  --end 23 \
  --label "(?=.*Extended)(?=.*AMZN).*" \
  --limit 1 \
  --format raw \
  --extract magnet \
  --out office-superfan-episodes-s9.txt
```

**Scrape a single episode and dump to stdout as JSON:**

```bash
exto \
  --id breaking-bad-s1213 \
  --res 1080p \
  --season 5 \
  --episode 14 \
  --dump \
  --format json
```

**Scrape episodes 1-10 concurrently (3 at a time):**

```bash
exto \
  --id better-call-saul-s2073 \
  --res 720p \
  --season 1 \
  --end 10 \
  --concurrency 3 \
  --format csv \
  --out season1.csv
```

## Development

```bash
npm run dev              # Run without building
npm run build            # Compile TypeScript
npm run format           # Format all files with Prettier
npm run format:check     # Check formatting
```

## How It Works

1. Launches a headless browser via [Camoufox](https://github.com/daiyi1997/camoufox-js) with human-like behavior
2. Navigates to ext.to episode pages and bypasses Cloudflare challenges using
   OCR ([Tesseract.js](https://github.com/naptha/tesseract.js))
3. Extracts torrent links, applies label filtering, and validates magnet URIs with [Zod](https://zod.dev/)
4. Outputs results in JSON, CSV, or raw format

## License

MIT
