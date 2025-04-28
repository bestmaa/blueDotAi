

import {  forwardHeadingForCell } from "../../store/nativeMessageStore";
import { directionDataCollection, realTimeMagDataFilter, sensorDataCollection } from "../Sensor/CollectData";
import {  findNearestGrid, getWeightedGridPosition, updateSmoothPDR } from "../Sensor/SencerUtils";
import { applyLowPassFilter, canvasClear, ClickHighlightGridCell, drawGridCollectionPercentage, DrawGridOnCanvas,  drawPDRPathFromDirectionMap,   drawSmoothPDRDot, drawTop5NearestGridsOnCanvas } from "./CanvasUtils";



let animationId: number;
export function Draw() {
    let clear = canvasClear()
    if (!clear) return
    // DrawImageOnCanvas()
    DrawGridOnCanvas()
    ClickHighlightGridCell()
    sensorDataCollection()
    directionDataCollection()
    drawGridCollectionPercentage()
    realTimeMagDataFilter()
    // updatePDR(accelerometerSignal.value, orientationSignal.value);
    if (forwardHeadingForCell.value !== null) {
        drawPDRPathFromDirectionMap(forwardHeadingForCell.value)
    }
    updateSmoothPDR();
    drawSmoothPDRDot()
    let data = findNearestGrid({ topNearPoint: 3 })
    if (data.length > 0) {
        drawTop5NearestGridsOnCanvas(data)
        let weightedPos = getWeightedGridPosition(data)
        if (weightedPos) applyLowPassFilter(weightedPos);
        // drawSmoothDot(smoothPosition.value)
    }
    // drawPDRPosition();
    animationId = requestAnimationFrame(Draw);
}

export function StopDraw() {
    cancelAnimationFrame(animationId);
}
