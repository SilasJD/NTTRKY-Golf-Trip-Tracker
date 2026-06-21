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

// Rapidly press ArrowUp 6 times (hole 1, par 4): 1,2,3,4,5,6 -- final diff = +2 (double bogey)
for (let i = 0; i < 6; i++) {
  await page.keyboard.press("ArrowUp");
  await new Promise((r) => setTimeout(r, 80));
}

const immediateToastCount = await page.evaluate(
  () => document.querySelectorAll(".fixed.inset-x-0.top-2 > div").length
);
console.log("TOASTS_IMMEDIATELY_AFTER_RAPID_INCREMENTS", immediateToastCount);

await new Promise((r) => setTimeout(r, 1300));

const afterWaitToasts = await page.evaluate(() =>
  [...document.querySelectorAll(".fixed.inset-x-0.top-2 > div")].map((el) => el.textContent)
);
console.log("TOASTS_AFTER_DEBOUNCE_WAIT", JSON.stringify(afterWaitToasts));

await browser.disconnect();
