#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import pLimit from "p-limit";
import { getEpisodeLinks } from "./crawler";
import { saveResults } from "./storage";
import { ScraperOptions } from "./types";

const argv = yargs(hideBin(process.argv))
    .option("id", { type: "string", demandOption: true })
    .option("res", { type: "string", demandOption: true })
    .option("season", { type: "number", demandOption: true })
    .option("start", { type: "number", default: 1 })
    .option("end", { type: "number" })
    .option("label", { type: "string" })
    .option("limit", { type: "number" })
    .option("out", { type: "string" })
    .option("dump", { type: "boolean", default: false })
    .option("format", { type: "string", choices: ["json", "csv", "raw"], default: ["json"] })
    .option("extract", { type: "array", default: ["label", "href", "magnet"] })
    .option("concurrency", { type: "number", default: 1 })
    .option("headless", {
        type: "boolean",
        default: false,
    })
    .parseSync() as unknown as ScraperOptions;

async function run() {
    const end = argv.end ?? argv.start;
    const count = end >= argv.start ? end - argv.start + 1 : 0;
    const episodes = Array.from({ length: count }, (_, i) => argv.start + i);
    const allResults: any[] = [];

    const limit = pLimit(argv.concurrency ?? 2);

    const tasks = episodes.map((episode) =>
        limit(async () => {
            console.log(`Processing episode: ${episode}`);
            try {
                const links = await getEpisodeLinks(
                    argv.id,
                    argv.res,
                    argv.season,
                    episode,
                    argv.label,
                    argv.limit,
                    argv.headless,
                );
                allResults.push(...links);
                console.log(`Done with episode: ${episode}`);
            } catch (err) {
                console.error(`Error processing episode ${episode}:`, err);
            }
        }),
    );

    await Promise.all(tasks);

    await saveResults(allResults, argv);
    console.log("Done!");
    process.exit(0);
}

run().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
