/// old code 

let stepCounter = 0;
const STEP_THRESHOLD = 3;
let lastStepTimePDR = 0
// let yawChangeThreshold = 10; // deg
const headingTolerance = 15; // deg allowed around forwardAngle
const stepHeadingHistory: number[] = []; // heading collection

export function updateSmoothPDR() {
  const acc = accelerometerSignal.value;
  console.log('acc: ', acc);
  const orientation = orientationSignal.value;
  if (!trackingMode.value) return;
  if(!currentGridKey.value) {
    alert("plz select your current position")
    trackingMode.value=false
    return
  }

  const accMag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
  // console.log('accMag: ', accMag);
  const now = Date.now();
  const delta = Math.abs(accMag - 9.8);

  const currentYawDeg = (orientation.yaw * 180) / Math.PI;
  const currentYawNormalized = ((currentYawDeg % 360) + 360) % 360;  // 0 to 359 ke bich 

  // console.log('delta: ', delta,accMag);
  if (delta > 1 && now - lastStepTimePDR > 500) {
    lastStepTimePDR = now;

    const expectedForwardAngle = forwardHeadingForCell.value?.[currentGridKey.value]?.forwardAngle;
    if (expectedForwardAngle == null) {
      console.log("🛑 No forward angle available for current grid:", currentGridKey.value);
      return;
    }

    let headingDiff = Math.abs(currentYawNormalized - expectedForwardAngle);
    if (headingDiff > 180) headingDiff = 360 - headingDiff;

    console.log(`🔍 Current Heading: ${currentYawNormalized.toFixed(2)}°, Expected: ${expectedForwardAngle.toFixed(2)}°, Diff: ${headingDiff.toFixed(2)}°`);

    // 🛑 अगर heading गलत है तो kuch bhi update mat karo
    if (headingDiff > headingTolerance) {
      console.log("🛑 Heading not matching! No step counted.");
      return;
    }

    // ✅ Agar heading match kar raha hai, tab hi step count aur position update
    stepCounter++;
    stepHeadingHistory.push(currentYawNormalized);
    console.log(`✅ Step accepted. StepCounter: ${stepCounter}`);

    // ✅ Update interpolatedPosition
    const from = currentGridKey.value;
    const to = Object.entries(forwardHeadingForCell.value || {}).find(
      ([_key, val]) => val.previouskey === currentGridKey.value
    )?.[0];

    if (to) {
      const [fromCol, fromRow] = from.split(",").map(Number);
      const [toCol, toRow] = to.split(",").map(Number);

      const progress = stepCounter / STEP_THRESHOLD;

      interpolatedPosition.value = {
        x: (fromCol + (toCol - fromCol) * progress) * gridSizeSignal.value + gridSizeSignal.value / 2,
        y: (fromRow + (toRow - fromRow) * progress) * gridSizeSignal.value + gridSizeSignal.value / 2
      };
    }

    // ✅ After STEP_THRESHOLD steps, move to next grid
    if (stepCounter >= STEP_THRESHOLD) {
      const nextGrid = Object.entries(forwardHeadingForCell.value || {}).find(
        ([_key, val]) => val.previouskey === currentGridKey.value
      )?.[0];

      if (nextGrid) {
        console.log(`✅ Moving to next grid: ${nextGrid}`);
        currentGridKey.value = nextGrid;
      } else {
        console.log("🛑 No next grid available even after correct steps.");
      }

      // Reset after move
      stepCounter = 0;
      stepHeadingHistory.length = 0;
    }
  }
}