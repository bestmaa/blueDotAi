import { magneticFingerPrint, orientationSignal } from "../store/nativeMessageStore";
import { computed } from '@preact/signals-react';
import styles from '../moduleStyle/CollectedDataStats.module.css'
import { getCompassHeading } from "../utils/Sensor/SencerUtils";
import { collectData } from "../store/visualCanvasStore";
import { granularity, totalSections } from "../store/constant";

export const CollectedDataStats = computed(() => {
    if (!collectData.value) return
    const collectedHeadings = Object.keys(magneticFingerPrint.value).map(Number);
    const percentageCompleted = (collectedHeadings.length / totalSections) * 100;
    let { yaw } = orientationSignal.value
    let compassHeading = getCompassHeading(yaw)
    const currentHeading = compassHeading


    return (
        <div className={styles.linearProgressBar}>
            <div className={styles.percentageText}>
                Collected: {Math.round(percentageCompleted)}% | Current: {currentHeading ?? '--'}
            </div>
            <div className={styles.progressRow}>
                {Array.from({ length: totalSections }, (_, idx) => {
                    const angle = idx * granularity;
                    const isCollected = collectedHeadings.includes(angle);
                    const isCurrent = Math.round(currentHeading / granularity) * granularity === angle;
                    if(isCollected && !isCurrent) return null
                    return (
                        <div
                            key={angle}
                            className={`${styles.angleItem} ${isCollected ? styles.collected : ''} ${isCurrent ? styles.current : ''}`}
                        >
                            {angle}
                        </div>
                    );
                })}
            </div>
            
        </div>
    );
});
