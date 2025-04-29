import { canvasHeightSignal, canvasOnClickMousePosition, canvasRefSignal, canvasWidthSignal, selectedCell, gridSizeSignal, imageObjectSignal, collectData, smoothPosition, currentGridKey } from "../../store/visualCanvasStore";
import floorImage from '../../assets/floor.jpg';
import { allMagneticFingerPrint, ForwardHeadingMap, interpolatedPosition, pdrPosition, trackingIndex, trackingMode, trackingPath } from "../../store/nativeMessageStore";
import { totalSections } from "../../store/constant";
import { gridName } from "../Sensor/SencerUtils";
export function ClickOnCanvas(e: MouseEvent): { x: number; y: number, col: number, row: number } | null {
    if (collectData.value) return null
    const canvas = canvasRefSignal.value;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridSize = gridSizeSignal.value;
    const col = Math.floor(x / gridSize);
    const row = Math.floor(y / gridSize);
    canvasOnClickMousePosition.value = { x, y, col, row }
    selectedCell.value = { row, col }
    currentGridKey.value = gridName()
    return { x, y, col, row };
}

export function canvasClear() {
    const canvas = canvasRefSignal.value
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return ctx
}

export function GetCanvasAndContext(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
    const canvas = canvasRefSignal.value;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return null;
    return { canvas, ctx };
}

export function DrawImageOnCanvas() {
    let res = GetCanvasAndContext()
    if (!res) return
    let { canvas, ctx } = res
    if (!imageObjectSignal.value) {
        imageObjectSignal.value = new Image();
        imageObjectSignal.value.src = floorImage;

        imageObjectSignal.value.onload = () => {
            canvasWidthSignal.value = imageObjectSignal.value!.width;
            canvasHeightSignal.value = imageObjectSignal.value!.height;
            canvas.width = imageObjectSignal.value!.width;
            canvas.height = imageObjectSignal.value!.height;
            ctx.drawImage(imageObjectSignal.value!, 0, 0, canvas.width, canvas.height);
        };
    } else {
        ctx.drawImage(imageObjectSignal.value, 0, 0, canvas.width, canvas.height);
    }
}

export function DrawGridOnCanvas() {
    const res = GetCanvasAndContext();
    if (!res) return;
    const { ctx } = res;

    const gridSize = gridSizeSignal.value;
    const cols = Math.floor(canvasWidthSignal.value / gridSize);
    const rows = Math.floor(canvasHeightSignal.value / gridSize);

    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.strokeRect(c * gridSize, r * gridSize, gridSize, gridSize);
        }
    }
}

export function ClickHighlightGridCell(color = 'rgba(255, 0, 0, 0.3)') {
    const res = GetCanvasAndContext();
    if (!res) return;
    const { ctx } = res;

    const pos = canvasOnClickMousePosition.value;
    if (!pos) return;

    const gridSize = gridSizeSignal.value;

    ctx.fillStyle = color;
    ctx.fillRect(pos.col * gridSize, pos.row * gridSize, gridSize, gridSize);
}

export function drawGridCollectionPercentage() {
    const canvas = canvasRefSignal.value
    const ctx = canvas?.getContext('2d');
    if (!ctx) return
    Object.entries(allMagneticFingerPrint.value).forEach(([gridKey, angles]) => {
        const [col, row] = gridKey.split(',').map(Number);

        const collectedCount = Object.keys(angles).length;
        const percent = Math.round((collectedCount / totalSections) * 100);

        const gridSize = gridSizeSignal.value;
        const x = col * gridSize + gridSize / 2;
        // console.log('x: ', x);
        const y = row * gridSize + gridSize / 2;
        // console.log('y: ', y);


        ctx.fillStyle = 'red';
        ctx.font = 'bold 14px sans-serif'; // ✅ bigger font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // ✅ better alignment
        ctx.fillText(`${percent}%  ${gridKey}`, x, y);
    });
}

export function initializeTrackingPath() {
    const keys = Object.keys(allMagneticFingerPrint.value);
    const path = keys.map(key => {
        const [col, row] = key.split(',').map(Number);
        return { col, row };
    });
    trackingPath.value = path;
    trackingIndex.value = 0;
}

let lastCollectedTime = 0;

export function drawTrackingDot() {
    const canvas = canvasRefSignal.value
    const ctx = canvas?.getContext('2d');
    if (!ctx) return
    if (!trackingMode.value || trackingPath.value.length === 0) return;

    console.log("yese ");

    const gridSize = gridSizeSignal.value;
    const current = trackingPath.value[trackingIndex.value];
    const x = current.col * gridSize + gridSize / 2;
    const y = current.row * gridSize + gridSize / 2;

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();

    if (lastCollectedTime > 500) {
        trackingIndex.value++;
        lastCollectedTime = 0
    }
    lastCollectedTime++
    if (trackingIndex.value >= trackingPath.value.length) {
        trackingIndex.value = 0; // reset or stop if needed
        trackingMode.value = false;

    }

}

export function drawTop5NearestGridsOnCanvas(topGrids: { grid: string; angle: number; distance: number; point: any; }[]) {
    const canvas = canvasRefSignal.value;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !trackingMode.value) return;
    const gridSize = gridSizeSignal.value;
    // 🔁 1. Unique gridKeys nikaal lo
    // const uniqueGridKeys = new Set(topGrids.map(g => `${g.point.col},${g.point.row}`));

    // 🎨 2. White background fill ek hi baar per grid
    // uniqueGridKeys.forEach((key) => {
    //     const [col, row] = key.split(',').map(Number);
    //     // const gridX = col * gridSize;
    //     // const gridY = row * gridSize;

    //     // ctx.fillStyle = "white";
    //     // ctx.fillRect(gridX, gridY, gridSize, gridSize);
    // });
    topGrids.forEach(({ point, distance }, index) => {
        const x = point.col * gridSize + gridSize / 2;
        const y = point.row * gridSize + gridSize / 2;

        // Draw circle
        ctx.beginPath();
        ctx.arc(x, y, 10 - index, 0, Math.PI * 2);
        ctx.strokeStyle = ['#00f', '#0a0', '#f80', '#f08', '#888'][index];
        ctx.lineWidth = 2;
        ctx.stroke();

        // Set text style
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = "black";

        // Dynamic label positions based on rank
        let labelX = x;
        let labelY = y;

        switch (index) {
            case 0: // center
                break;
            case 1: // left
                labelX = x - 20;
                break;
            case 2: // top
                labelY = y - 20;
                break;
            case 3: // right
                labelX = x + 20;
                break;
            case 4: // bottom
                labelY = y + 20;
                break;
        }

        ctx.fillText(`${Math.round(distance)}`, labelX, labelY);
    });
}

export function applyLowPassFilter(newPos: { col: number, row: number }, alpha: number = 0.1) {
    return smoothPosition.value = {
        col: (1 - alpha) * smoothPosition.value.col + alpha * newPos.col,
        row: (1 - alpha) * smoothPosition.value.row + alpha * newPos.row,
    };
}

let positionHistory: string[] = [];

export function getStableGrid(currentGrid: string, windowSize = 10): string {
    positionHistory.push(currentGrid);
    if (positionHistory.length > windowSize) {
        positionHistory.shift(); // remove old
    }

    // frequency count
    const freqMap: Record<string, number> = {};
    for (const grid of positionHistory) {
        freqMap[grid] = (freqMap[grid] || 0) + 1;
    }

    // get most common grid
    return Object.entries(freqMap).sort((a, b) => b[1] - a[1])[0][0];
}

export function drawSmoothDot(Position: { col: number, row: number }) {
    const canvas = canvasRefSignal.value;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !trackingMode.value) return;

    const gridSize = gridSizeSignal.value;
    const { col: x, row: y } = Position;

    ctx.beginPath();
    ctx.arc(x * gridSize + gridSize / 2, y * gridSize + gridSize / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();
}

export function drawPDRPosition() {
    const canvas = canvasRefSignal.value;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const gridSize = gridSizeSignal.value;
    const { x, y } = pdrPosition.value;
    // console.log('x, y: ', x, y);

    ctx.beginPath();
    ctx.arc(x * gridSize + gridSize / 2, y * gridSize + gridSize / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = "green";
    ctx.fill();
}

export function drawPDRPathFromDirectionMap(directionMap: ForwardHeadingMap) {
    // console.log('directionMap: ', directionMap);
    const canvas = canvasRefSignal.value;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const gridSize = gridSizeSignal.value;

    Object.entries(directionMap).forEach(([key, data]) => {
        const { previouskey } = data;
        if (!previouskey) return;
        // console.log('previouskey: ', previouskey);

        const [col1, row1] = previouskey.split(",").map(Number);
        const [col2, row2] = key.split(",").map(Number);

        const x1 = col1 * gridSize + gridSize / 2;
        const y1 = row1 * gridSize + gridSize / 2;
        const x2 = col2 * gridSize + gridSize / 2;
        const y2 = row2 * gridSize + gridSize / 2;

        // Draw path line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "#00aaff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrow dot
        ctx.beginPath();
        ctx.arc(x2, y2, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#0077cc";
        ctx.fill();
    });
}


export function drawSmoothPDRDot() {
    const canvas = canvasRefSignal.value;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = interpolatedPosition.value;

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
}
