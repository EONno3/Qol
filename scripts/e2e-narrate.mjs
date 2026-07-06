/**
 * E2E: fuse mission + breaker + insulated boots → scrape narrative text.
 * Run: npx playwright test scripts/e2e-narrate.spec.mjs (or node with playwright)
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAVE_JSON = readFileSync(join(__dirname, "e2e-save.json"), "utf8");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.route("**/localhost:5001/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok", model_loaded: true }),
    });
  });

  await page.goto("http://localhost:5173/");

  await page.evaluate((save) => {
    localStorage.setItem("cyberpunk_mercenary_save_v1", save);
    localStorage.setItem("mvp_game_save", save);
  }, SAVE_JSON);

  await page.reload({ waitUntil: "networkidle" });

  await page.getByRole("button", { name: /LOAD GAME/i }).click();
  await page.waitForSelector("text=미션 게시판", { timeout: 15000 });

  const aiToggle = page.locator("#ai-narrator-toggle");
  if (!(await aiToggle.isChecked())) {
    await aiToggle.check();
  }

  await page.getByRole("button", { name: /미션 게시판/i }).click();
  await page.getByText("더 퓨즈 제3변전소 고압 캐패시터 적출").click();
  await page.getByText("서명하여 수주").click();

  await page.getByRole("button", { name: /수주 미션/i }).click();
  await page.getByText("더 퓨즈 제3변전소 고압 캐패시터 적출").click();

  await page.getByRole("button", { name: /차단기/ }).click();
  await expectWireBonus(page);

  const narrateResponsePromise = page.waitForResponse(
    (r) => r.url().includes(":5001/narrate") && r.status() === 200,
    { timeout: 120_000 }
  );

  const slider = page.getByRole("slider", { name: "밀어서 출격" });
  await slider.fill("100");

  let narrateJson = null;
  try {
    const narrateResp = await narrateResponsePromise;
    narrateJson = await narrateResp.json();
  } catch (e) {
    console.warn("WARN: /narrate response not received:", e.message);
  }

  await page.getByText("[Debug: 시간 가속]").click();

  const reportBtn = page.getByRole("button", { name: "보고서 열람" });
  await reportBtn.waitFor({ timeout: 10000 });
  await reportBtn.click();

  const narrativeBox = page.locator(".narrative-box");
  await narrativeBox.waitFor({ timeout: 15000 });

  // LLM narrate 완료까지 대기 (최대 120초)
  const deadline = Date.now() + 120_000;
  let text = "";
  while (Date.now() < deadline) {
    text = (await narrativeBox.innerText()).trim();
    if (
      text &&
      !text.includes("작전 현장 데이터 스트림 판독 중") &&
      text.length > 20
    ) {
      break;
    }
    await page.waitForTimeout(2000);
  }

  const isGenerating = text.includes("작전 현장 데이터 스트림 판독 중");

  console.log("=== E2E_NARRATIVE_START ===");
  console.log(text);
  console.log("=== E2E_NARRATIVE_END ===");
  console.log("is_generating:", isGenerating);
  if (narrateJson?.narrative) {
    console.log("=== E2E_NARRATE_API_START ===");
    console.log(narrateJson.narrative);
    console.log("=== E2E_NARRATE_API_END ===");
  }

  await browser.close();
}

async function expectWireBonus(page) {
  const stats = page.locator(".slot-stats");
  const statsText = await stats.innerText();
  if (!statsText.includes("54") || !statsText.includes("+6")) {
    console.warn("WARN: loadout bonus not visible in matching UI:", statsText);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
