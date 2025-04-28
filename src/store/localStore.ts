import { allMagneticFingerPrint, magneticBuffer, magneticFingerPrint } from "./nativeMessageStore";

export const saveMagneticFingerprintToLocalStorage = (newData: any) => {
    console.log('newData: ', newData);
    const storedDataJSON = localStorage.getItem('magneticFingerprintData');
    let storedData = storedDataJSON ? JSON.parse(storedDataJSON) : {};
    const mergedData = mergeMagneticData(storedData, newData);
    console.log('mergedData: ', mergedData);
    localStorage.setItem('magneticFingerprintData', JSON.stringify(mergedData));
    magneticFingerPrint.value = {};
    magneticBuffer.value = {}
    allMagneticFingerPrint.value = mergedData
};

function mergeMagneticData(oldData: any, newData: any) {
    const mergedData = { ...oldData };

    for (const key in newData) {
        if (mergedData[key]) {
            // Agar andar wali key bhi hai to usko bhi merge karenge
            mergedData[key] = { ...mergedData[key], ...newData[key] };
        } else {
            // Agar andar wali key nahi hai, to sidha newData se le lenge
            mergedData[key] = newData[key];
        }
    }

    return mergedData;
}

export function saveDirectionData(data:any){
    localStorage.setItem('DirectionData', JSON.stringify(data));
}
export function getDirectionData(){
   let data= localStorage.getItem('DirectionData');
   if(data){
    return JSON.parse(data)
   }else{
    return null
   }
}

export function LoadMagneticData() {
    const storedDataJSON = localStorage.getItem('magneticFingerprintData');
    let storedData = storedDataJSON ? JSON.parse(storedDataJSON) : {};
    allMagneticFingerPrint.value = storedData
}

export let clearLocalstorage = () => {
    localStorage.clear()
}

