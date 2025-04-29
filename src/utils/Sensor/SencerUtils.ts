import { mean, std } from "mathjs";
import { currentGridKey, gridSizeSignal, selectedCell } from "../../store/visualCanvasStore";
import { accelerometerSignal, allMagneticFingerPrint,  forwardHeadingForCell, gyroscopeDiviceAngle,  interpolatedPosition, orientationSignal, pdrPosition, realTimeAvgMagData, stepCount, trackingMode } from "../../store/nativeMessageStore";


export const getCompassHeading = (yaw: number) => {
  //Old 
  const yawInDegrees = yaw * (180 / Math.PI);
  return Math.round((yawInDegrees + 360) % 360);

}
export const removeOutliers = (samples: { x: number; y: number; z: number }[], threshold = 1) => {
  const xVals = samples.map(s => s.x);
  const yVals = samples.map(s => s.y);
  const zVals = samples.map(s => s.z);

  const xMean = mean(xVals) as number;
  const yMean = mean(yVals) as number;
  const zMean = mean(zVals) as number;


  const xStd = std(xVals, 'uncorrected') as number || 1; // avoid divide by 0
  const yStd = std(yVals, 'uncorrected') as number || 1;
  const zStd = std(zVals, 'uncorrected') as number || 1;

  return samples.filter(sample => {
    const zX = Math.abs((sample.x - xMean) / xStd);
    const zY = Math.abs((sample.y - yMean) / yStd);
    const zZ = Math.abs((sample.z - zMean) / zStd);
    return zX < threshold && zY < threshold && zZ < threshold;
  });
};
export let gridName = () => {
  if (selectedCell.value == null) return null
  let { col, row } = selectedCell.value
  return `${col},${row}`
  // return Object.values(selectedCell.value).join()
}

export function findNearestGrid({ topNearPoint = 5 }: { topNearPoint?: number } = {}) {
  const realTime = realTimeAvgMagData.value;
  if (!realTime || !trackingMode.value) return [];
  const fingerprint = allMagneticFingerPrint.value;
  const heading = realTime.Heading;

  const nearbyAngles = [- 6, - 3, 0, 3, 6].map((h) => ((h + heading) + 360) % 360);

  const distanceList: {
    grid: string;
    distance: number;
    point: any;
    angle: number;
  }[] = [];

  for (const [gridKey, angleMap] of Object.entries(fingerprint)) {
    const matches = nearbyAngles.map((a) => angleMap[a.toString()]).filter(Boolean);
    if (matches.length === 0) continue;

    const avg = {
      x: matches.reduce((sum, m) => sum + m.x, 0) / matches.length,
      y: matches.reduce((sum, m) => sum + m.y, 0) / matches.length,
      z: matches.reduce((sum, m) => sum + m.z, 0) / matches.length,
    };

    const dist = Math.sqrt(
      (realTime.x - avg.x) ** 2 +
      (realTime.y - avg.y) ** 2 +
      (realTime.z - avg.z) ** 2
    );

    distanceList.push({
      grid: gridKey,
      distance: dist,
      point: angleMap[heading.toString()]?.point || matches[0]?.point,
      angle: heading,
    });
  }

  return distanceList.sort((a, b) => a.distance - b.distance).slice(0, topNearPoint);
}

export function getWeightedGridPosition(topGrids: { grid: string; distance: number; point: { row: number; col: number } }[]) {
  if (topGrids.length === 0) return null;
  // if (topGrids[0].distance > 2) {
  //   console.log("❌ Too noisy — skipping update");
  //   return null;
  // }
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (const { distance, point } of topGrids) {
    const weight = 1 / (distance + 0.001); // avoid divide by zero
    totalWeight += weight;
    weightedX += point.col * weight;
    weightedY += point.row * weight;
  }

  return {
    col: weightedX / totalWeight,
    row: weightedY / totalWeight
  };
}




export let sendWebtoNetive = (data: any) => {
  if (window.ReactNativeWebView && window?.ReactNativeWebView?.postMessage) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  }
}
// utils/Sensor/PDRUtils.ts
let lastStepTime = 0;
const STEP_LENGTH = 0.7;

export function updatePDR(acc: { x: number; y: number; z: number }, orientation: { yaw: number }) {
  const accMagnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
  const now = Date.now();
  const delta = Math.abs(accMagnitude - 9.8);

  if (delta > 1 && now - lastStepTime > 500) {
    lastStepTime = now;

    // Convert yaw to radians and normalize
    const headingRad = ((orientation.yaw * 180) / Math.PI + 360) % 360 * (Math.PI / 180);

    // Update position
    pdrPosition.value = {
      x: pdrPosition.value.x + STEP_LENGTH * Math.cos(headingRad) * 50 / 1.2,
      y: pdrPosition.value.y + STEP_LENGTH * Math.sin(headingRad) * 50 / 1.2,
    };

    stepCount.value += 1;
    // console.log(stepCount.value);

  }
}





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
  const currentYawNormalized = ((currentYawDeg % 360) + 360) % 360;

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


export function updateSmoothPDR$Nice() {
  const acc = accelerometerSignal.value;
  const orientation = orientationSignal.value;
  if (!trackingMode.value) return;
  if(!currentGridKey.value) {
    alert("plz select your current position")
    trackingMode.value=false
    return
  }
  const accMag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
  const now = Date.now();
  const delta = Math.abs(accMag - 9.8);

  const currentYawDeg = (orientation.yaw * 180) / Math.PI;

  if (delta > 1 && now - lastStepTimePDR > 500) {
    lastStepTimePDR = now;

    // ✅ Step 1: Check current heading
    const expectedForwardAngle = forwardHeadingForCell.value?.[currentGridKey.value]?.forwardAngle;
    if (expectedForwardAngle == null) return;

    let headingDifference = Math.abs(currentYawDeg - expectedForwardAngle);
    if (headingDifference > 180) headingDifference = 360 - headingDifference; // normalize

    if (headingDifference > headingTolerance) {
      console.log("🛑 Wrong Direction Detected! Reset step counter.");
      stepCounter = 0; // ❌ heading wrong hai — reset steps
      return;
    }

    // ✅ Step 2: Heading is OK, count the step
    stepCounter++;
    console.log(`✅ Step accepted. Step counter = ${stepCounter}`);

    const from = currentGridKey.value;
    const to = Object.entries(forwardHeadingForCell.value || {}).find(
      ([_key, val]) => val.previouskey === currentGridKey.value
    )?.[0];

    if (!to) return;

    const [fromCol, fromRow] = from.split(",").map(Number);
    const [toCol, toRow] = to.split(",").map(Number);

    const progress = stepCounter / STEP_THRESHOLD;

    interpolatedPosition.value = {
      x: (fromCol + (toCol - fromCol) * progress) * gridSizeSignal.value + gridSizeSignal.value / 2,
      y: (fromRow + (toRow - fromRow) * progress) * gridSizeSignal.value + gridSizeSignal.value / 2
    };

    if (stepCounter >= STEP_THRESHOLD) {
      console.log(`🚶‍♂️ Moving to next grid: ${to}`);
      stepCounter = 0;
      currentGridKey.value = to;
    }
  }
}






export function updateSmoothPDRold() {
  const acc = accelerometerSignal.value;
  // const orientation = orientationSignal.value;
  // console.log('orientation: ', orientation);
  if (!trackingMode.value) return
  if(!currentGridKey.value) {
    alert("plz select your current position")
    trackingMode.value=false
    return
  }
  const accMag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
  const now = Date.now();
  const delta = Math.abs(accMag - 9.8);
  // ✅ yaw बदलने का डिफरेंस
  // console.log('delta: ', now - lastStepTimePDR);
  // if (yawDiff > yawChangeThreshold && delta < 2) {
  //   console.log("🛑 सिर्फ घूम रहा है – step skip");
  //   return;
  // }
  if (delta > 1 && now - lastStepTimePDR > 500) {
    console.log('delta: ', delta);
    lastStepTimePDR = now;
    stepCounter++;
    // console.log('stepCounter: ', orientation);

    const from = currentGridKey.value;
    const to = Object.entries(forwardHeadingForCell.value || {}).find(
      ([_key, val]) => val.previouskey === currentGridKey.value
    )?.[0];

    if (!to) return;

    const [fromCol, fromRow] = from.split(",").map(Number);
    const [toCol, toRow] = to.split(",").map(Number);

    const progress = stepCounter / STEP_THRESHOLD;

    // const targetPos = {
    //   x: (fromCol + (toCol - fromCol) * progress) * gridSizeSignal.value + gridSizeSignal.value / 2,
    //   y: (fromRow + (toRow - fromRow) * progress) * gridSizeSignal.value + gridSizeSignal.value / 2
    // };
    interpolatedPosition.value = {
      x: (fromCol + (toCol - fromCol) * progress) * gridSizeSignal.value + gridSizeSignal.value / 2,
      y: (fromRow + (toRow - fromRow) * progress) * gridSizeSignal.value + gridSizeSignal.value / 2
    };
    if (stepCounter >= STEP_THRESHOLD) {
      stepCounter = 0;
      currentGridKey.value = to;
    }
  }


}

let totalRotationDeg = 0; // कुल कितना घूमा है
let lastUpdateTime = Date.now();

export function trackGyroRotation(gyro: any) {
  const now = Date.now();
  const deltaTimeSec = (now - lastUpdateTime) / 1000; // सेकंड में
  lastUpdateTime = now;

  // gyro.z (radians/sec) × deltaTime (sec) = radians घूमे
  const rotationRad = gyro.z * deltaTimeSec;
  // const rotationRad = gyro.z 
  // radians को degrees में बदलो
  const rotationDeg = rotationRad * (180 / Math.PI);

  // कुल rotation में जोड़ो
  totalRotationDeg += rotationDeg;
  totalRotationDeg = ((totalRotationDeg % 360) + 360) % 360;

  let displayedDeg = Math.round(totalRotationDeg);
  if (displayedDeg === 360) displayedDeg = 0; // ✅ Important correction
  gyroscopeDiviceAngle.value = displayedDeg
  // console.clear()
  // ✅ अब totalRotationDeg में मिलेगा कि कितने degree घूमे हो
  // console.log("अब तक कुल rotation:", displayedDeg, "°");
}
