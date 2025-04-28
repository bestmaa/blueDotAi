import React, { useRef, useEffect } from 'react';
import {
    canvasRefSignal,
    canvasWidthSignal,
    canvasHeightSignal,
} from '../store/visualCanvasStore';
import { Draw, StopDraw } from '../utils/Canvas/Draw';
import { ClickOnCanvas } from '../utils/Canvas/CanvasUtils';



export const CanvasGridPage: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvasRefSignal.value = canvas;
        const handleClick = (e: MouseEvent) => ClickOnCanvas(e);
        canvas.addEventListener('click', handleClick);
        Draw()
        return () => {
            StopDraw()
            canvas.removeEventListener('click', handleClick);
            canvasRefSignal.value = null;
        };
    }, [canvasRef.current]);

    return (
        <div >
            <canvas
            
                ref={canvasRef}
                width={canvasWidthSignal.value}
                height={canvasHeightSignal.value}
                className="border shadow-lg"
            />
        </div>
    );
};
