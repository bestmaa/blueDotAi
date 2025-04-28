import { useEffect } from "react";
import { magnetometerSignal, accelerometerSignal, gyroscopeSignal, orientationSignal, forwardHeadingForCell, } from "../store/nativeMessageStore";
import { getDirectionData, LoadMagneticData } from "../store/localStore";

declare global {
    interface Window {
        receiveDataFromReactNative: (data: any) => void;
        ReactNativeWebView?: {
            postMessage: (message: string) => void;
        };
    }
}
const WebViewHandler = () => {
    useEffect(() => {
        const handler = (data: any) => {
            const { message: { magnetometerSignal: mg, accelerometerSignal: ace, gyroscopeSignal: gyro, orientationSignal: ori } } = data;
            magnetometerSignal.value = mg;
            accelerometerSignal.value = ace;
            gyroscopeSignal.value = gyro;
            orientationSignal.value = ori;
            // console.log(mg,ace,gyro,ori);

        };
        LoadMagneticData()
        forwardHeadingForCell.value=getDirectionData()
        window.receiveDataFromReactNative = handler;

        return () => {
            window.receiveDataFromReactNative = () => { }; // cleanup
        };
    }, []);


    return null;
};

export default WebViewHandler;
