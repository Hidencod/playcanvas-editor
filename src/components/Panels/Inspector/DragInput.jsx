import React, { useState, useRef, useEffect } from 'react';

export default function DragInput({
    value,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    step = 0.1,
    className = '',
    label = '',
    color = 'gray'
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startValue, setStartValue] = useState(0);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const dragSensitivity = step; // pixels per step
            const delta = Math.round(deltaX / 5) * dragSensitivity;
            const newValue = (startValue + delta).toFixed(3);

            onChange(newValue);
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                document.body.style.cursor = '';
            }
        };

        if (isDragging) {
            document.body.style.cursor = 'ew-resize';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, startX, startValue, onChange, step]);

    const handleLabelMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setStartX(e.clientX);
        setStartValue(parseFloat(value) || 0);
    };

    const colorMap = {
        red: 'text-red-400',
        green: 'text-green-400',
        blue: 'text-blue-400',
        gray: 'text-gray-400'
    };

    const borderColorMap = {
        red: 'focus:border-red-500',
        green: 'focus:border-green-500',
        blue: 'focus:border-blue-500',
        gray: 'focus:border-gray-500'
    };

    return (
        <div>
            <label
                className={`text-xs block mb-1 cursor-ew-resize select-none ${colorMap[color]}`}
                onMouseDown={handleLabelMouseDown}
            >
                {label}
            </label>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className={`w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none ${borderColorMap[color]} ${className}`}
            />
        </div>
    );
}