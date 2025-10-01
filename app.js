// app.js — Seven Knights: Rebirth Farm Simulator (with Monthly Packs toggles)
// Run: npm i express && node app.js
// Open: http://localhost:3000

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

/** ---- Domain constants ---- */
const SECS_PER_DAY = 24 * 60 * 60;
const DEFAULTS = {
  expToLv30: 12480,          // EXP รวมจาก Lv1 -> Lv30
  rubyPerHeroLv30: 20,       // รูบี้/ฮีโร่เวล 30
  keyRegenIntervalSec: 180,  // ฟื้น 1 กุญแจ ทุก 3 นาที (ฐาน)
  keyPackReduceSec: 60,      // แพ็คลดเวลาฟื้นกุญแจ 60 วิ
};

/** Core simulate */
function simulate({
  keysBase = 0,                // กุญแจที่มีเริ่มต้น
  keysPerRound = 6,           // กุญแจ/รอบ (ด่านปกติ 6, ด่านพิเศษ 12)
  expPerRound = 1250,         // EXP/รอบ
  heroesPerRound = 4,         // จำนวนฮีโร่ที่ปั้นพร้อมกัน/รอบ
  expToLv30 = DEFAULTS.expToLv30,
  rubyPerHeroLv30 = DEFAULTS.rubyPerHeroLv30,

  // ซื้อแพ็กกุญแจ
  buy50Times = 0,             // 0–20
  buy80Times = 0,             // 0–50
  buy100Times = 0,            // 0–50

  // แพ็ครายเดือนแบบติ๊ก
  hasMonthlyExp10 = false,    // EXP +10%
  hasMonthlyKeyMinus60 = false, // ลดเวลาฟื้นกุญแจ 60 วิ

  // ตั้งค่าระยะเวลาฟื้น (กรณีอยากลองค่าอื่น)
  baseKeyRegenIntervalSec = DEFAULTS.keyRegenIntervalSec,

  // เวลาเฉลี่ย/รอบ
  avgTimePerRound = 30,       // วินาที/รอบ
}) {
  // 1) Effective EXP/round (แพ็ค EXP +10%)
  const effectiveExpPerRound = expPerRound * (1 + (hasMonthlyExp10 ? 0.10 : 0));

  // 2) รอบที่ต้องใช้จนเลเวล 30 (ปัดขึ้น)
  const roundsToLv30 = Math.max(1, Math.ceil(expToLv30 / effectiveExpPerRound));

  // 3) กุญแจฟรีต่อวันจากการฟื้น (มีผลจากแพ็คลด 60 วิ)
  const regenInterval =
    Math.max(1, baseKeyRegenIntervalSec - (hasMonthlyKeyMinus60 ? DEFAULTS.keyPackReduceSec : 0));
  const dailyKeysFromRegen = Math.floor(SECS_PER_DAY / regenInterval);

  // 4) กุญแจจากการซื้อแพ็ก
  const keysFrom50 = 60 * Math.max(0, Math.min(20, buy50Times));
  const keysFrom80 = 60 * Math.max(0, Math.min(50, buy80Times));
  const keysFrom100 = 60 * Math.max(0, Math.min(50, buy100Times));
  const rubyCost = 50 * Math.max(0, Math.min(20, buy50Times)) + 80 * Math.max(0, Math.min(50, buy80Times)) + 100 * Math.max(0, Math.min(50, buy100Times));

  // 5) กุญแจรวมวันนี้
  const totalKeys = keysBase + dailyKeysFromRegen + keysFrom50 + keysFrom80 + keysFrom100;

  // 6) คำนวณรอบ / ชุดปั้น
  const totalRounds = Math.floor(totalKeys / keysPerRound);
  const fullSets = Math.floor(totalRounds / roundsToLv30); // 1 ชุด = ปั้นครบ Lv30 สำหรับ heroesPerRound ตัว

  // 7) ผลลัพธ์จากฮีโร่เวล 30
  const heroesLv30 = fullSets * heroesPerRound;
  const rubyFromHeroes = heroesLv30 * rubyPerHeroLv30;

  // 8) กำไรสุทธิ
  const profit = rubyFromHeroes - rubyCost;

  // 9) คงเหลือ
  const roundsUsed = fullSets * roundsToLv30;
  const keysUsed = roundsUsed * keysPerRound;
  const keysLeft = totalKeys - keysUsed;
  const roundsLeft = totalRounds - roundsUsed;

  // 10) เวลารวมที่ใช้
  const totalTimeSeconds = roundsUsed * avgTimePerRound;
  const totalTimeMinutes = totalTimeSeconds / 60;
  const totalTimeHours = totalTimeMinutes / 60;

  return {
    effectiveExpPerRound,
    roundsToLv30,
    regenInterval,
    dailyKeysFromRegen,
    totalKeys,
    totalRounds,
    fullSets,
    heroesLv30,
    rubyFromHeroes,
    rubyCost,
    profit,
    keysUsed,
    keysLeft,
    roundsLeft,
    totalTimeSeconds,
    totalTimeMinutes,
    totalTimeHours,
  };
}

app.get("/", (_req, res) => {
  res.send(`<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Seven Knights Farm Simulator</title>
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
<style>
  body { background: #0b0f1a; color: #e5e7eb; }
  .card { background: #111827; border-radius: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
  .btn { background: #ef4444; padding:.6rem 1rem; border-radius:.75rem; font-weight:600; }
  .btn.gray { background:#374151; }
  .stat { background:#0f172a; border-radius:.75rem; padding:1rem; }
  input, select { color:#111827 }
</style>
</head>
<body class="min-h-screen">
  <div class="max-w-6xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-2">Seven Knights: Rebirth — Farm Simulator</h1>
    <p class="text-gray-300 mb-6">จำลองการฟาร์มออโต้โดยอิงกฎกุญแจ/EXP/ฮีโร่ Lv30 และแพ็ครายเดือน (ติ๊กเพื่อเปิดผล)</p>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- CONFIG -->
      <div class="card p-5">
        <h2 class="text-xl font-bold mb-3">ตั้งค่าการฟาร์ม</h2>
        <form id="form" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <label>กุญแจเริ่มต้น (มีติดตัว)
              <input class="w-full p-2 rounded" type="number" name="keysBase" value="0" min="0">
            </label>
            <label>แผนที่ (EXP/รอบ)
              <select class="w-full p-2 rounded" name="expPerRound" id="mapSelect">
                <!-- Normal Mode Maps -->
                <optgroup label="โหมดปกติ (Normal Mode)">
                  <option value="650">แผนที่ 1-1 (650 EXP)</option>
                  <option value="940">แผนที่ 2-1 (940 EXP)</option>
                  <option value="940">แผนที่ 3-1 (940 EXP)</option>
                  <option value="940">แผนที่ 4-1 (940 EXP)</option>
                  <option value="940">แผนที่ 5-1 (940 EXP)</option>
                  <option value="940">แผนที่ 6-1 (940 EXP)</option>
                  <option value="940">แผนที่ 7-1 (940 EXP)</option>
                  <option value="970">แผนที่ 8-1 (970 EXP)</option>
                  <option value="1000">แผนที่ 9-1 (1000 EXP)</option>
                  <option value="1030">แผนที่ 10-1 (1030 EXP)</option>
                  <option value="1060">แผนที่ 11-1 (1060 EXP)</option>
                  <option value="1090">แผนที่ 12-1 (1090 EXP)</option>
                  <option value="1120">แผนที่ 13-1 (1120 EXP)</option>
                  <option value="1150" selected>แผนที่ 14-1 (1150 EXP)</option>
                </optgroup>
                <!-- Nightmare Mode Maps -->
                <optgroup label="โหมด Nightmare">
                  <option value="1180">แผนที่ 1-1 Nightmare (1180 EXP)</option>
                  <option value="1180">แผนที่ 2-1 Nightmare (1180 EXP)</option>
                </optgroup>
              </select>
            </label>
            <label>EXP รวมถึง Lv30
              <div class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600">${DEFAULTS.expToLv30}</div>
            </label>
            <label>ช่วงเวลาฟื้นกุญแจ (วินาที)
              <div class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600">${DEFAULTS.keyRegenIntervalSec}</div>
            </label>
            <label>เวลาเฉลี่ย/รอบ (วินาที)
              <input class="w-full p-2 rounded" type="number" name="avgTimePerRound" value="30" min="1">
            </label>
          </div>

          <hr class="my-4 border-gray-700">

          <h3 class="font-semibold">ช่วงเวลาฟาร์ม (สำหรับคำนวณกุญแจฟื้น)</h3>
          <div class="grid grid-cols-2 gap-3">
            <label>เริ่มฟาร์มเวลา
              <input class="w-full p-2 rounded" type="time" name="farmStartTime" value="07:00">
            </label>
            <label>จบฟาร์มเวลา
              <input class="w-full p-2 rounded" type="time" name="farmEndTime" value="06:59">
            </label>
          </div>

          <hr class="my-4 border-gray-700">

          <h3 class="font-semibold">ซื้อกุญแจด้วยรูบี้</h3>
          <div class="grid grid-cols-1 gap-3">
            <label>กล่องกุญแจ 50 ruby × <span class="text-gray-400">(0–20)</span>
              <input class="w-full p-2 rounded" type="number" name="buy50Times" value="0" min="0" max="20">
            </label>
            <label>กล่องกุญแจ 80 ruby × <span class="text-gray-400">(0–50)</span>
              <input class="w-full p-2 rounded" type="number" name="buy80Times" value="0" min="0" max="50">
            </label>
            <label>กล่องกุญแจ 100 ruby × <span class="text-gray-400">(0–50)</span>
              <input class="w-full p-2 rounded" type="number" name="buy100Times" value="0" min="0" max="50">
            </label>
          </div>

          <hr class="my-4 border-gray-700">

          <h3 class="font-semibold">แพ็ครายเดือน (ติ๊กเพื่อใช้ผล)</h3>
          <label class="flex items-center gap-2">
            <input type="checkbox" name="hasMonthlyExp10">
            <span>EXP +10%</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" name="hasMonthlyKeyMinus60">
            <span>ลดเวลาฟื้นกุญแจ 60 วินาที (3 นาที → 2 นาที)</span>
          </label>

          <div class="flex items-center gap-3 mt-4">
            <button type="submit" class="btn">คำนวณ</button>
            <button type="button" id="presetNormal" class="btn gray">Preset: โหมดปกติ</button>
            <button type="button" id="presetNightmare" class="btn gray">Preset: โหมด Nightmare</button>
          </div>
        </form>
      </div>

      <!-- RESULT -->
      <div class="card p-5">
        <h2 class="text-xl font-bold mb-3">ผลลัพธ์</h2>
        <div class="grid md:grid-cols-2 gap-3">
          <div class="stat"><div class="text-gray-400 text-sm">EXP/รอบ (หลังบัฟ)</div><div id="effExp" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">รอบที่ต้องใช้จน Lv30</div><div id="roundsToLv30" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">กุญแจฟื้นในช่วงเวลาที่เลือก</div><div id="periodKeys" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">กุญแจรวมวันนี้</div><div id="totalKeys" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">รอบทั้งหมดที่เล่นได้</div><div id="totalRounds" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">ฮีโร่ Lv30</div><div id="heroes" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">Ruby จากฮีโร่</div><div id="rubyFromHeroes" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">Ruby ที่จ่าย (ซื้อกุญแจ)</div><div id="rubyCost" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">กำไรสุทธิ</div><div id="profit" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">กุญแจที่ใช้ / เหลือ</div><div id="keysUse" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">รอบที่ใช้ / เหลือ</div><div id="roundUse" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">เวลารวมที่ใช้ (ชั่วโมง)</div><div id="totalHours" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">เวลารวมที่ใช้ (ชั่วโมง:นาที)</div><div id="totalTimeFormatted" class="text-2xl font-bold">—</div></div>
          <div class="stat"><div class="text-gray-400 text-sm">เวลารวมที่ใช้ (นาที)</div><div id="totalMinutes" class="text-2xl font-bold">—</div></div>
        </div>
      </div>
    </div>

    <p class="mt-6 text-gray-400 text-sm">
      เคล็ดลับ: ด่านพิเศษให้ตั้งกุญแจ/รอบ = 12 และฮีโร่/รอบ = 8. ถ้าติ๊กแพ็ค "ลดเวลาฟื้นกุญแจ 60 วิ"
      ระบบจะคำนวณกุญแจฟรี/วันจาก 3 นาที/ดอก → 2 นาที/ดอก อัตโนมัติ.
    </p>
  </div>

<script>
  const SECS_PER_DAY = ${SECS_PER_DAY};
  function toNumber(v, d=0){ const n = Number(v); return Number.isFinite(n)? n : d; }
  function fmt(n){ return new Intl.NumberFormat('th-TH').format(n); }

  function runCalc() {
    const f = document.getElementById('form');
    
    // Auto-detect game mode based on selected map
    const selectedOption = f.expPerRound.options[f.expPerRound.selectedIndex];
    const isNightmare = selectedOption.closest('optgroup').label.includes('Nightmare');
    
    let keysPerRound, heroesPerRound;
    
    if (isNightmare) {
      keysPerRound = 12;
      heroesPerRound = 8;
    } else {
      keysPerRound = 6;
      heroesPerRound = 4;
    }
    
    const data = {
      keysBase: toNumber(f.keysBase.value, 0),
      keysPerRound: keysPerRound,
      expPerRound: toNumber(f.expPerRound.value, 1150),
      heroesPerRound: heroesPerRound,
      expToLv30: ${DEFAULTS.expToLv30},

      buy50Times: Math.min(20, Math.max(0, toNumber(f.buy50Times.value, 0))),
      buy80Times: Math.min(50, Math.max(0, toNumber(f.buy80Times.value, 0))),
      buy100Times: Math.min(50, Math.max(0, toNumber(f.buy100Times.value, 0))),

      hasMonthlyExp10: f.hasMonthlyExp10.checked,
      hasMonthlyKeyMinus60: f.hasMonthlyKeyMinus60.checked,

      baseKeyRegenIntervalSec: ${DEFAULTS.keyRegenIntervalSec},
      avgTimePerRound: toNumber(f.avgTimePerRound.value, 30),
      farmStartTime: f.farmStartTime.value,
      farmEndTime: f.farmEndTime.value,
    };

    const effectiveExpPerRound = data.expPerRound * (1 + (data.hasMonthlyExp10 ? 0.10 : 0));
    const roundsToLv30 = Math.max(1, Math.ceil(data.expToLv30 / effectiveExpPerRound));

    const regenInterval = Math.max(1, data.baseKeyRegenIntervalSec - (data.hasMonthlyKeyMinus60 ? ${DEFAULTS.keyPackReduceSec} : 0));
    const dailyKeysFromRegen = Math.floor(SECS_PER_DAY / regenInterval);

    // Calculate keys regenerated in custom time period
    function calculatePeriodKeys(startTime, endTime, regenInterval) {
      // Parse time strings (HH:MM format)
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      // Convert to total minutes from midnight
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      let periodSeconds;
      
      if (endMinutes < startMinutes) {
        // Cross-day period (e.g., 07:00 to 06:59 next day)
        periodSeconds = (24 * 60 - startMinutes + endMinutes) * 60;
      } else {
        // Same day period
        periodSeconds = (endMinutes - startMinutes) * 60;
      }
      
      return Math.floor(periodSeconds / regenInterval);
    }
    
    const periodKeysFromRegen = calculatePeriodKeys(data.farmStartTime, data.farmEndTime, regenInterval);

    const keysFrom50 = 60 * data.buy50Times;
    const keysFrom80 = 60 * data.buy80Times;
    const keysFrom100 = 60 * data.buy100Times;
    const rubyCost = 50 * data.buy50Times + 80 * data.buy80Times + 100 * data.buy100Times;

    const totalKeys = data.keysBase + periodKeysFromRegen + keysFrom50 + keysFrom80 + keysFrom100;
    const totalRounds = Math.floor(totalKeys / data.keysPerRound);
    const fullSets = Math.floor(totalRounds / roundsToLv30);

    const heroesLv30 = fullSets * data.heroesPerRound;
    const rubyFromHeroes = heroesLv30 * ${DEFAULTS.rubyPerHeroLv30};
    const profit = rubyFromHeroes - rubyCost;

    const roundsUsed = fullSets * roundsToLv30;
    const keysUsed = roundsUsed * data.keysPerRound;
    const keysLeft = totalKeys - keysUsed;
    const roundsLeft = totalRounds - roundsUsed;

    // Calculate total time spent
    const totalTimeSeconds = roundsUsed * data.avgTimePerRound;
    const totalTimeMinutes = totalTimeSeconds / 60;
    const totalTimeHours = totalTimeMinutes / 60;

    // render
    document.getElementById('effExp').textContent = fmt(Math.round(effectiveExpPerRound));
    document.getElementById('roundsToLv30').textContent = fmt(roundsToLv30);
    document.getElementById('periodKeys').textContent = fmt(periodKeysFromRegen) + " (" + data.farmStartTime + " - " + data.farmEndTime + ")";
    document.getElementById('totalKeys').textContent = fmt(totalKeys);
    document.getElementById('totalRounds').textContent = fmt(totalRounds);
    document.getElementById('heroes').textContent = fmt(heroesLv30);
    document.getElementById('rubyFromHeroes').textContent = fmt(rubyFromHeroes);
    document.getElementById('rubyCost').textContent = fmt(rubyCost);
    document.getElementById('profit').textContent = fmt(profit);
    document.getElementById('keysUse').textContent = fmt(keysUsed) + " / " + fmt(keysLeft);
    document.getElementById('roundUse').textContent = fmt(roundsUsed) + " / " + fmt(roundsLeft);
    document.getElementById('totalHours').textContent = totalTimeHours.toFixed(2);
    
    // Format time as hours:minutes
    const hours = Math.floor(totalTimeHours);
    const minutes = Math.round((totalTimeHours - hours) * 60);
    document.getElementById('totalTimeFormatted').textContent = hours + ":" + minutes.toString().padStart(2, '0');
    
    document.getElementById('totalMinutes').textContent = totalTimeMinutes.toFixed(1);
  }

  document.getElementById('form').addEventListener('submit', (e)=>{ e.preventDefault(); runCalc(); });
  
  // Auto-update when map selection changes
  document.getElementById('expPerRound').addEventListener('change', runCalc);
  
  // Auto-update when time period changes
  document.getElementById('farmStartTime').addEventListener('change', runCalc);
  document.getElementById('farmEndTime').addEventListener('change', runCalc);

  // Presets
  document.getElementById('presetNormal').addEventListener('click', ()=>{
    const f = document.getElementById('form');
    f.expPerRound.value = '1150'; // Map 14-1 Normal
    runCalc();
  });
  document.getElementById('presetNightmare').addEventListener('click', ()=>{
    const f = document.getElementById('form');
    f.expPerRound.value = '1180'; // Map 1-1 Nightmare
    runCalc();
  });

  // First render
  runCalc();
</script>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log("Farm Simulator running at http://localhost:" + PORT);
});
