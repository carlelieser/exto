import * as fs from "node:fs";
import path from "node:path";
import { stringify } from "csv-stringify/sync";
import { Link, ScraperOptions } from "./types.js";

export const saveResults = async (results: Array<Link>, options: ScraperOptions) => {
    if (!options.out && !options.dump) return;

    let extracted: Array<any> = results;

    if (options.extract && options.extract.length > 0) {
        extracted = results.map((link) => {
            return Object.fromEntries(
                Object.entries(link).filter(([key]) => options.extract!.includes(key)),
            );
        });
    }

    let data = "";

    if (options.format === "json") {
        data = JSON.stringify(extracted, null, 2);
    } else if (options.format === "csv") {
        data = stringify(extracted, {
            header: true,
            columns: options.extract,
        });
    } else if (options.format === "raw") {
        data = extracted.map((obj) => Object.values(obj).join(" ")).join("\n");
    }

    if (options.dump) {
        console.log(data);
    } else if (options.out) {
        await fs.promises.writeFile(path.resolve(options.out), data);
        console.log(`Results saved to ${options.out}`);
    }
};
