// Loads the public Suwannee Room menu page in a real browser, reads every dish
// for each meal (today + tomorrow), and writes plain-text files to ./menu/.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const URL = "https://seminoledining.mydininghub.com/en/location/suwannee-room";
const MEALS = ["Breakfast", "Brunch", "Lunch", "Dinner"];
const OUT = "menu";

// ---- functions run inside the page ----
const pageFns = () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const heading = () =>
    [...document.querySelectorAll("h2,h3")].find((e) => /Daily Menu/.test(e.textContent)) ||
    [...document.querySelectorAll("h1")].find((e) => /Daily Menu/.test(e.textContent));
  const headingText = () => (heading()?.textContent || "").replace(/\s+/g, " ").trim();

  window.__availableMeals = async () => {
    const mb = [...document.querySelectorAll("button")].find((b) => /^Meal:/.test(b.innerText.trim()));
    if (!mb) return [];
    if (mb.getAttribute("aria-expanded") !== "true") { mb.click(); await sleep(600); }
    const names = [...document.querySelectorAll("button[role=option]")].map((b) => b.textContent.trim());
    mb.click(); await sleep(300);
    return names;
  };

  window.__selectMeal = async (meal) => {
    const re = new RegExp("Daily Menu\\s*" + meal + "\\b");
    if (re.test(headingText())) return true;
    const mb = [...document.querySelectorAll("button")].find((b) => /^Meal:/.test(b.innerText.trim()));
    if (!mb) return false;
    if (mb.getAttribute("aria-expanded") !== "true") { mb.click(); await sleep(600); }
    const opt = [...document.querySelectorAll("button[role=option]")].find((b) => b.textContent.trim() === meal);
    if (!opt) { mb.click(); return false; }
    opt.click();
    for (let i = 0; i < 60 && !re.test(headingText()); i++) await sleep(250);
    await sleep(2000);
    return re.test(headingText());
  };

  window.__nextDate = async () => {
    const before = headingText();
    const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Next Date");
    if (!b) return false;
    b.click();
    for (let i = 0; i < 60 && headingText() === before; i++) await sleep(250);
    await sleep(2500);
    return headingText() !== before;
  };

  window.__extract = async () => {
    for (const b of [...document.querySelectorAll("button")].filter((b) =>
      /^View more /.test(b.getAttribute("aria-label") || ""))) b.click();
    await sleep(1500);
    const head = heading();
    const out = [];
    let cur = null;
    for (const e of document.querySelectorAll("h3,h4")) {
      if (head && !(head.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
      if (e.tagName === "H3") {
        cur = e.className.includes("text-heading-3") ? { station: e.textContent.trim(), items: [], extra: false } : null;
        if (cur) out.push(cur);
        continue;
      }
      if (!cur) continue;
      const n = e.textContent.replace(/\s+/g, " ").trim();
      if (/^Also available at/.test(n)) { cur.extra = true; continue; } // skip toppings/condiments
      if (!cur.extra && n && !cur.items.includes(n)) cur.items.push(n);
    }
    return {
      title: headingText(),
      stations: out.filter((s) => s.items.length).map(({ station, items }) => ({ station, items })),
    };
  };
};

// ---- formatting ----
function format(meal, dateLabel, stations) {
  const lines = [`🍽 Suwannee ${meal} — ${dateLabel}`, ""];
  for (const s of stations) {
    lines.push(s.station.toUpperCase());
    for (const i of s.items) lines.push(`• ${i}`);
    lines.push("");
  }
  return lines.join("\n").trim() + "\n";
}

function notServed(meal, dateLabel, available) {
  const alt = available.length ? `\nServed that day: ${available.join(", ")}.` : "";
  return `Suwannee isn't serving ${meal.toLowerCase()} on ${dateLabel}.${alt}\n`;
}

async function scrapeDay(page) {
  const available = (await page.evaluate(() => window.__availableMeals())).filter((m) => MEALS.includes(m));
  const results = {};
  let dateLabel = "";
  for (const meal of available) {
    if (!(await page.evaluate((m) => window.__selectMeal(m), meal))) continue;
    const r = await page.evaluate(() => window.__extract());
    dateLabel = (r.title.match(/-\s*(.+)$/) || [])[1] || dateLabel; // e.g. "Thu 11/12"
    results[meal] = r.stations;
  }
  return { available, results, dateLabel };
}

async function writeDay(prefix, day) {
  const label = day.dateLabel || prefix;
  const all = [];
  for (const meal of MEALS) {
    let stations = day.results[meal];
    let shownMeal = meal;
    // Weekends: no breakfast/lunch, but brunch covers both.
    if (!stations?.length && (meal === "Breakfast" || meal === "Lunch") && day.results.Brunch?.length) {
      stations = day.results.Brunch;
      shownMeal = "Brunch";
    }
    const text = stations?.length ? format(shownMeal, label, stations) : notServed(meal, label, day.available);
    await writeFile(`${OUT}/${prefix}-${meal.toLowerCase()}.txt`, text);
    if (day.results[meal]?.length) all.push(text);
  }
  await writeFile(`${OUT}/${prefix}.txt`, all.length ? all.join("\n\n") : `No Suwannee menu posted for ${label}.\n`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ timezoneId: "America/New_York", viewport: { width: 1280, height: 900 } });
await page.goto(URL, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForFunction(() => /Daily Menu/.test(document.body.innerText + [...document.querySelectorAll("h1,h2,h3")].map((e) => e.textContent).join(" ")), null, { timeout: 60000 });
await page.waitForTimeout(3000);
await page.evaluate(pageFns);
await mkdir(OUT, { recursive: true });

const today = await scrapeDay(page);
await writeDay("today", today);

if (await page.evaluate(() => window.__nextDate())) {
  const tomorrow = await scrapeDay(page);
  await writeDay("tomorrow", tomorrow);
}

await writeFile(`${OUT}/updated.txt`, new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) + "\n");
console.log("Today:", today.dateLabel, Object.keys(today.results));
await browser.close();

if (!Object.keys(today.results).length) {
  console.error("No meals found today — page layout may have changed.");
  process.exitCode = 1;
}
