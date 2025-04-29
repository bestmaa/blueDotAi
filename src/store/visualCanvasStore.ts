import { signal } from '@preact/signals-react';

export const canvasRefSignal = signal<HTMLCanvasElement | null>(null);
export const canvasOnClickMousePosition = signal<{ x: number, y: number, col: number, row: number } | null>(null)

export const gridSizeSignal = signal(50);
export const selectedCell = signal<{ row: number; col: number } | null>(null);
export const collectData = signal<boolean>(false)
export const directionDataCollectionStatus = signal<boolean>(false)
export const imageObjectSignal = signal<HTMLImageElement | null>(null);
export const imageLoadedSignal = signal(false);
export const canvasWidthSignal = signal(800);
export const canvasHeightSignal = signal(600);
export const smoothPosition = signal<{ col: number, row: number }>({ col: 0, row: 0 });
export const currentGridKey = signal<string | null>("3,0")
