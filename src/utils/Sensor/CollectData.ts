import { bufferSize, granularity } from "../../store/constant"
import { forwardHeadingForCell, gyroscopeDiviceAngle, magneticBuffer, magneticFingerPrint, magnetometerSignal, orientationSignal, realTimeAvgMagData, trackingMode } from "../../store/nativeMessageStore"
import { collectData, directionDataCollectionStatus, selectedCell } from "../../store/visualCanvasStore"
import { getCompassHeading, gridName, removeOutliers } from "../Sensor/SencerUtils"

let lastCollectedTime = 0;
const COLLECTION_INTERVAL = 50; // milliseconds
// ye variable dono function me hai sensorDataCollection and directionDataCollection  
let currentCellAndHeading: { col: number, row: number, Heading: number, key: string } | null = null
let previouskey: string | null = null
let previousGyro: number | null = null

export function sensorDataCollection() {
    if (directionDataCollectionStatus.value) return
    if (!collectData.value) {
        currentCellAndHeading = null
        return
    }
    if (selectedCell.value === null) {
        alert('plz select grid Point')
        collectData.value = false
        return
    }
    if (!magnetometerSignal.value) {
        alert("Not Start Sensor")
        return
    }
    const now = Date.now();
    if (now - lastCollectedTime < COLLECTION_INTERVAL) return; // ⛔ cooldown logic
    lastCollectedTime = now; // ✅ update last collect time
    const { pitch, roll, yaw } = orientationSignal.value;

    const pitchDeg = pitch * (180 / Math.PI);
    const rollDeg = roll * (180 / Math.PI);
    if (pitchDeg < -10 || pitchDeg > 0) return;
    if (rollDeg < -3 || rollDeg > 3) return;
    let compassHeading = getCompassHeading(yaw)

    if (!currentCellAndHeading) {

        let KeyName = gridName()
        console.log("gaya isme ", currentCellAndHeading);
        currentCellAndHeading = { ...selectedCell.value, Heading: compassHeading, key: KeyName! }
        forwardHeadingForCell.value = { ...forwardHeadingForCell.value, [KeyName!]: { forwardAngle: compassHeading, previouskey } }
        previouskey = KeyName
    }

    compassHeading = Math.round(compassHeading / granularity) * granularity;
    // if (compassHeading % 5 !== 0) return
    let avg = magFilterData(compassHeading)
    if (!avg) return

    magneticFingerPrint.value = { ...magneticFingerPrint.value, [compassHeading]: { ...avg, Heading: compassHeading, point: selectedCell.value } };
}


let lastCollectedTimeForDirection = 0;
const COLLECTION_INTERVAL_ForDirection = 60; // milliseconds
export function directionDataCollection() {
    if (collectData.value) return
    if (!directionDataCollectionStatus.value) {
        currentCellAndHeading = null
        return
    }
    if (selectedCell.value === null) {
        alert('plz select grid Point')
        directionDataCollectionStatus.value = false
        return
    }

    const now = Date.now();
    if (now - lastCollectedTimeForDirection < COLLECTION_INTERVAL_ForDirection) return; // ⛔ cooldown logic
    lastCollectedTimeForDirection = now; // ✅ update last collect time
    const { pitch, roll, yaw } = orientationSignal.value;

    const pitchDeg = pitch * (180 / Math.PI);
    const rollDeg = roll * (180 / Math.PI);
    if (pitchDeg < -10 || pitchDeg > 0) return;
    if (rollDeg < -3 || rollDeg > 3) return;
    let compassHeading = getCompassHeading(yaw)

    if (!currentCellAndHeading) {
        let KeyName = gridName()
        currentCellAndHeading = { ...selectedCell.value, Heading: compassHeading, key: KeyName! }
        forwardHeadingForCell.value = {
            ...forwardHeadingForCell.value,
            [KeyName!]: {
                forwardAngle: compassHeading,
                previouskey,
                previousGyroRotationDeg: previousGyro,
                forwardGyroAngle: gyroscopeDiviceAngle.value
            }
        }
        console.log('previouskey: ', previouskey);
        previouskey = KeyName
        previousGyro = gyroscopeDiviceAngle.value
    }


}


export function realTimeMagDataFilter() {
    if (!trackingMode.value) return
    const now = Date.now();
    if (now - lastCollectedTime < COLLECTION_INTERVAL) return; // ⛔ cooldown logic
    lastCollectedTime = now; // ✅ update last collect time
    const { pitch, roll, yaw } = orientationSignal.value;

    const pitchDeg = pitch * (180 / Math.PI);
    const rollDeg = roll * (180 / Math.PI);
    if (pitchDeg < -10 || pitchDeg > 0) return;
    if (rollDeg < -3 || rollDeg > 3) return;
    let compassHeading = getCompassHeading(yaw)
    compassHeading = Math.round(compassHeading / granularity) * granularity;
    // if (compassHeading % 5 !== 0) return
    let avg = magFilterData(compassHeading)
    if (!avg) return
    realTimeAvgMagData.value = { ...avg, Heading: Number(compassHeading) }
}


export function magFilterData(compassHeading: number) {
    if (magnetometerSignal.value) {
        if (!magneticBuffer.value[compassHeading]) {
            magneticBuffer.value[compassHeading] = [];
        }
        magneticBuffer.value[compassHeading].push(magnetometerSignal.value);
        if (magneticBuffer.value[compassHeading]?.length > bufferSize) {
            magneticBuffer.value[compassHeading].shift();
        }
    }
    if (magneticBuffer.value[compassHeading]?.length >= bufferSize) {
        const filtered = removeOutliers(magneticBuffer.value[compassHeading], 2);
        if (filtered.length === 0) {
            return null; // ✅ avoid NaN
        }
        const avg = {
            x: filtered.reduce((acc, val) => acc + val.x, 0) / filtered.length,
            y: filtered.reduce((acc, val) => acc + val.y, 0) / filtered.length,
            z: filtered.reduce((acc, val) => acc + val.z, 0) / filtered.length,
        };


        if (avg.x == null || avg.y == null || avg.z == null) return null
        return avg
        // magneticFingerPrint.value[compassHeading] = { ...avg, Heading: Number(compassHeading), point: gridName()! }
        // console.log('magneticFingerPrint.value: ', magneticFingerPrint.value);
    }
}