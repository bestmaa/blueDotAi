import { signal } from '@preact/signals-react'
interface magneticBufferType { [key: string]: { x: number; y: number; z: number }[] }
interface magneticFingerPrintType {
    [key: string]: {
        x: number;
        y: number;
        z: number;
        Heading: number;
        point: string;
    };
}
// Ek ek item ka shape
interface DirectionData {
    angle: number;
    steps: number;
}

// Pure map ka shape
interface DirectionMap {
    directionMap: {
        [key: string]: DirectionData; // jaise "G0→G1"
    };
}

export interface ForwardHeadingData {
    forwardAngle: number;
    previouskey?: string | null;
    previousGyroRotationDeg?: number | null;
    forwardGyroAngle?: number | null;
  }
  
  export type ForwardHeadingMap = { 
    [key: string]: ForwardHeadingData 
  };
// export const magnetometerSignal = signal<{ x: number, y: number, z: number } | null>(null)
export const magnetometerSignal = signal<{ x: number, y: number, z: number } | null>({ x: 0, y: 0, z: 0 })
export const accelerometerSignal = signal({ x: 0, y: 0, z: 0 })
export const gyroscopeSignal = signal({ x: 0, y: 0, z: 0 })
export const gyroscopeDiviceAngle=signal<number|null>(null)
export const orientationSignal = signal({ pitch: 0, roll: 0, yaw: 0 })
export const magneticBuffer = signal<magneticBufferType>({}) // isme buffer data rahega jitna buffer size rahega utna 
export const realTimeAvgMagData = signal<{ x: number, y: number, z: number, Heading: number } | null>(null)
export const magneticFingerPrint = signal<magneticFingerPrintType>({})
export const allMagneticFingerPrint = signal<{ [key: string]: magneticFingerPrintType }>({})
export const trackingMode = signal(false);
export const trackingIndex = signal(0); // current index of grid being visited
export const trackingPath = signal<{ col: number; row: number }[]>([]); // full path
export const pdrPosition = signal({ x: 0, y: 0 }); // float values
export const directionMap = signal<DirectionMap | null>(null)
export const forwardHeadingForCell = signal<ForwardHeadingMap|null>(null)
export const interpolatedPosition = signal<{ x: number, y: number }>({ x: 0, y: 0 });
export const stepCount = signal(0);
