import { computed } from '@preact/signals-react'
import { accelerometerSignal, forwardHeadingForCell, gyroscopeSignal, magneticFingerPrint, magnetometerSignal, orientationSignal, trackingMode } from '../store/nativeMessageStore';
import { getCompassHeading, gridName, sendWebtoNetive, trackGyroRotation } from '../utils/Sensor/SencerUtils';
import { collectData, currentGridKey, directionDataCollectionStatus, selectedCell } from '../store/visualCanvasStore';
import { clearLocalstorage, saveDirectionData, saveMagneticFingerprintToLocalStorage } from '../store/localStore';

let Display = computed(() => {
    let mg = magnetometerSignal.value;
    let ace = accelerometerSignal.value;
    let gyro = gyroscopeSignal.value;
    let ori = orientationSignal.value;
    trackGyroRotation(gyro)
    // console.log('ori: ', ori);
    // console.log(gyro.z.toFixed(2));

    let compassHeading = getCompassHeading(ori.yaw);
    const pitchDeg = (ori.pitch * 180) / Math.PI;
    const rollDeg = ori.roll * (180 / Math.PI);
    // Tilt Message logic
    let tiltMessage = null;
    // ✅ Allow only when pitch is between -10 and 0 degrees
    if (pitchDeg < -10) {
        tiltMessage = "📱 Too much up – please tilt down slightly";
        // return;
    }
    if (pitchDeg > 0) {
        tiltMessage = "📱 Tilted down – please tilt up slightly";
        // navigator.vibrate(200)
        // return;
    }
    if (rollDeg < -3) {
        tiltMessage = "📱 Tilted too much left – please straighten";
    }
    if (rollDeg > 3) {
        tiltMessage = "📱 Tilted too much right – please straighten";
    }

    return (
        <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2 text-blue-600">
                <span className="font-semibold">Compass Heading:</span> {compassHeading}&deg;
            </div>

            {/* Show Pitch Alert if too tilted */}
            {tiltMessage && (
                <div className="text-red-600 fixed font-semibold bg-red-50 border border-red-300 p-2 rounded-md shadow-sm">
                    {tiltMessage}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="font-semibold">Magnetometer</p>
                    <p>x: {mg?.x.toFixed(2)}, y: {mg?.y.toFixed(2)}, z: {mg?.z.toFixed(2)}</p>
                </div>
                <div>
                    <p className="font-semibold">Accelerometer</p>
                    <p>x: {ace.x.toFixed(2)}, y: {ace.y.toFixed(2)}, z: {ace.z.toFixed(2)}</p>
                </div>
                <div>
                    <p className="font-semibold">Gyroscope</p>
                    <p>x: {gyro.x.toFixed(2)}, y: {gyro.y.toFixed(2)}, z: {gyro.z.toFixed(2)}</p>
                </div>
                <div>
                    <p className="font-semibold">Orientation (&deg;)</p>
                    <p>pitch: {pitchDeg.toFixed(2)}, roll: {(ori.roll * 180 / Math.PI).toFixed(2)}, yaw: {(ori.yaw * 180 / Math.PI).toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
});

const CollectionBtnStartAndStop = computed(() => {
    const toggleCollecting = () => {

        collectData.value = !collectData.value;
        console.log('collectData.value: ', collectData.value);
        if (!collectData.value) {
            const gridKey = gridName()!;
            const newData = { [gridKey]: { ...magneticFingerPrint.value } };
            saveMagneticFingerprintToLocalStorage(newData);
            saveDirectionData(forwardHeadingForCell.value)

        }
    };
    return <button
        onClick={toggleCollecting}
        className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-all duration-200 ${collectData.value ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
        {collectData.value ? '🛑Stop' : '🧭Collect'}
    </button>
});
const directionDataCollectionStatusBtn = computed(() => {
    const toggleCollecting = () => {

        directionDataCollectionStatus.value = !directionDataCollectionStatus.value;
        currentGridKey.value=null
        saveDirectionData(forwardHeadingForCell.value)
        sendWebtoNetive(forwardHeadingForCell.value)
    };
    return <button
        onClick={toggleCollecting}
        className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-all duration-200 ${collectData.value ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
        {directionDataCollectionStatus.value ? 'stop record' : 'forward heading'}
    </button>
});

const ClearStorageButton = () => {
    const handleClear = () => {
        const confirmClear = window.confirm("Are you sure you want to clear all saved magnetic fingerprint data?");
        if (confirmClear) clearLocalstorage();
    };

    return (
        <button
            onClick={handleClear}
            className="w-full py-2 px-4 rounded-md bg-gradient-to-r from-yellow-400 to-red-500 text-white font-bold shadow hover:from-yellow-500 hover:to-red-600 transition duration-300"
        >
            🧹Clear
        </button>
    );
};

const TrackToggleButton = computed(() => {
    const toggleTracking = () => {
        trackingMode.value = !trackingMode.value;
        // initializeTrackingPath()
    };

    return (
        <button
            onClick={toggleTracking}
            className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-all duration-200 ${trackingMode.value ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
            {trackingMode.value ? '📍Stop ' : '🚶Start '}
        </button>
    );
});
function ShowSensorDataAndButton() {
    return (
        <div className="p-6 bg-white rounded-xl shadow-md max-w-lg mx-auto space-y-6 border border-gray-200">
            <h2 className=" font-bold text-center text-gray-700 flex items-center justify-center gap-2">
                Real-time Sensor Monitor  <b onClick={() => {
                    window.location.reload()
                }}>🔄 Restart</b>
            </h2>

            {Display}
            <div className="flex justify-center">
                <div className='p-1'>
                    {CollectionBtnStartAndStop}
                    {TrackToggleButton}
                </div>
                <div className='p-1'>
                    {directionDataCollectionStatusBtn}
                    <ClearStorageButton />

                </div>
            </div>


        </div>
    )
}

export default ShowSensorDataAndButton