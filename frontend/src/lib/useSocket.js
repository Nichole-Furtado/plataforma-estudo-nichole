import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from './api';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [output, setOutput] = useState([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('output', (data) => {
      setOutput((prev) => [...prev, data]);
    });

    socket.on('done', ({ exitCode }) => {
      setRunning(false);
      setOutput((prev) => [
        ...prev,
        {
          type: 'info',
          data: `\n${exitCode === 0 ? '— Finalizado com sucesso' : `— Finalizado com código ${exitCode}`}\n`,
        },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const execute = useCallback((code, language = 'python') => {
    if (!socketRef.current) return;
    setOutput([]);
    setRunning(true);
    socketRef.current.emit('execute', { code, language });
  }, []);

  const kill = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('kill');
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  return { connected, output, running, execute, kill, clearOutput };
}
