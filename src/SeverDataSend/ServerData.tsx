import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function ServerData() {
    const [headings, setHeadings] = useState<number[]>([]);

    useEffect(() => {
        const socket = io("http://192.168.10.111:3000");

        socket.on("connect", () => {
            console.log("✅ Socket connected");
        });

        socket.on("heading_update", (data: number) => {
            console.log("📡 Received heading via socket:", data);
            setHeadings(prev => [...prev.slice(-49), data]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div>
            <h2>ServerData (Socket)</h2>
            <ul>
                {headings.map((h, i) => (
                    <li key={i}>{h}°</li>
                ))}
            </ul>
        </div>
    );
}

export default ServerData;