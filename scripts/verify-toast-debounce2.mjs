import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://localhost:9333" });
const page = await browser.newPage();
await page.setViewport({ width: 412, height: 900 });

await page.goto("http://localhost:3000/scorecard", { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.removeItem("nttrky-current-player"));
await page.reload({ waitUntil: "networkidle0" });
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Nathan");
  btn?.click();
});
await new Promise((r) => setTimeout(r, 300));
await page.type("input[type=password]", "junyu");
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Sign in");
  btn?.click();
});
await new Promise((r) => setTimeout(r, 600));

await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("2026-07-25"));
  btn?.click();
});
await new Promise((r) => setTimeout(r, 600));

const input = await page.$("table tbody input[type=number]");
await input.click();

for (let i = 0; i < 6; i++) {
  await page.keyboard.press("ArrowUp");
  await new Promise((r) => setTimeout(r, 80));
}

const valueAfterPresses = await page.evaluate((el) => el.value, input);
console.log("INPUT_VALUE_AFTER_6_ARROWUPS", valueAfterPresses);

const focusedHole = await page.evaluate(() => {
  const row = document.activeElement?.closest("tr");
  return row?.querySelector("td")?.textContent?.trim();
});
console.log("FOCUS_STAYED_ON_HOLE", focusedHole);

console.log("waiting for debounce + a margin...");
await new Promise((r) => setTimeout(r, 2000));

const toasts = await page.evaluate(() =>
  [...document.querySelectorAll(".fixed.inset-x-0.top-2 > div")].map((el) => el.textContent)
);
console.log("TOASTS_AFTER_WAIT", JSON.stringify(toasts));

await browser.disconnect();
