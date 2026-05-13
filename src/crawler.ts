import { Camoufox, LaunchOptions } from "camoufox-js";
import { type Page } from "playwright-core";
import { createWorker, PSM, Worker } from "tesseract.js";
import { Link, linkSchema } from "./types";
import { wait } from "./utils";

const BASE_URL = "https://ext.to";

let tesseractWorker: Worker | null = null;

const getTesseractWorker = async () => {
    if (!tesseractWorker) {
        tesseractWorker = await createWorker("eng");
        await tesseractWorker.setParameters({
            tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        });
    }
    return tesseractWorker;
};

export const launch = (headless: boolean = true) => {
    const options: LaunchOptions = {
        humanize: true,
        geoip: true,
        main_world_eval: true,
        locale: "en-US",
        headless,
    };
    return Camoufox(options);
};

export const solveCloudflareChallenge = async (page: Page): Promise<void> => {
    const screenshot = await page.screenshot();
    const worker = await getTesseractWorker();

    const result = await worker.recognize(screenshot);

    const text = result.data.text;
    const hasChallenge = text.includes("Performing security verification");
    const ready = text.includes("Verify you are human");
    const verified = text.includes("Verification successful");

    if (!hasChallenge || verified) {
        return;
    }

    if (!ready) {
        await wait(2000);
        return solveCloudflareChallenge(page);
    }

    const navigationPromise = page.waitForNavigation({
        waitUntil: "networkidle",
    });

    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");

    await navigationPromise;
};

export const collectLinks = async (page: Page, labelFilter?: string, limit?: number) => {
    await page.waitForSelector(".torrent-title-link");

    const links = await page.locator(".torrent-title-link").all();
    const scriptURL = `${BASE_URL}/ajax/getSearchMagnet.php`;
    const results: Array<Link> = [];

    page.route("**/*", async (route) => {
        try {
            if (route.request().url() === scriptURL) {
                const response = await route.fetch();
                const json = await response.json();
                json.magnet = json.url;
                json.url = "";
                return route.fulfill({
                    response,
                    json,
                });
            }
            return route.continue();
        } catch (err) {
            console.error(`Error in page.route: ${err}`);
            return route.continue();
        }
    });

    let linkCount = 0;

    for await (const link of links) {
        linkCount++;

        const label = await link.innerText();

        if (labelFilter && !label.match(new RegExp(labelFilter))) {
            continue;
        }

        const href = await link.getAttribute("href");
        const td = link.locator("..").locator("..");
        const magnetBtn = td.locator(".search-magnet-btn");

        try {
            const [response] = await Promise.all([
                page.waitForResponse((res) => res.url() === scriptURL, { timeout: 3000 }),
                magnetBtn.click(),
            ]);

            const body = await response.json();
            const rawLink: any = {
                label,
                href: `${BASE_URL}${href!}`,
                magnet: body.magnet,
            };

            try {
                const validatedLink = linkSchema.parse(rawLink);
                results.push(validatedLink);
            } catch (err) {
                console.error(
                    `Validation failed for ${href}:`,
                    err instanceof Error ? err.message : err,
                );
            }
        } catch (err) {
            console.log(`Failed to get response for: ${href}`);
        }

        if (limit && linkCount >= limit) {
            break;
        }
    }

    return results;
};

export const getEpisodeLinks = async (
    id: string,
    res: string,
    season: number,
    episode: number,
    labelFilter?: string,
    limit?: number,
    headless?: boolean,
) => {
    const browser = await launch(headless);
    const page = await browser.newPage();
    const url = `${BASE_URL}/${id}/torrents/${res}/?s=${season}&e=${episode}`;

    try {
        await page.goto(url);
        await solveCloudflareChallenge(page);
        const links = await collectLinks(page, labelFilter, limit);
        return links;
    } finally {
        await browser.close();
    }
};
