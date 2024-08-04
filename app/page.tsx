"use client";

import { useState, useEffect } from 'react';
import { SettingsMenu, PasswordSettings } from "@/components/SettingsMenu";
import { CheckCircle2, Copy } from 'lucide-react';

const PasswordGenerator = () => {
    const [settings, setSettings] = useState<PasswordSettings>({
        length: 12,
        rings: 4,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
    });

    const [rings, setRings] = useState<string[][]>([]);
    const [selectedSlots, setSelectedSlots] = useState<boolean[][]>([]);
    const [generatingRing, setGeneratingRing] = useState(-1);
    const [password, setPassword] = useState<string[]>([]);

    const [passwordStrength, setPasswordStrength] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        initializeRings();
    }, [settings]);

    const initializeRings = () => {
        const newRings: string[][] = [];
        const newSelectedSlots: boolean[][] = [];
        const charsPerRing = Math.ceil(settings.length / settings.rings);

        for (let i = 0; i < settings.rings; i++) {
            newRings.push(Array(26).fill('A'));
            newSelectedSlots.push(Array(26).fill(false));
        }

        setRings(newRings);
        setSelectedSlots(newSelectedSlots);
        setPassword(Array(settings.rings).fill(''));
    };

    const handleSlotSelect = (ringIndex: number, slotIndex: number) => {
        setSelectedSlots(prev => {
            const newSlots = [...prev];
            const ringSlots = [...newSlots[ringIndex]];
            const charsPerRing = Math.ceil(settings.length / settings.rings);
            if (ringSlots[slotIndex]) {
                ringSlots[slotIndex] = false;
            } else if (ringSlots.filter(Boolean).length < charsPerRing) {
                ringSlots[slotIndex] = true;
            }
            newSlots[ringIndex] = ringSlots;
            return newSlots;
        });
    };

    const startGeneration = () => {
        setGeneratingRing(0);
        generateRing(0);
    };

    const generateRing = (ringIndex: number) => {
        let intervalCount = 0;
        const interval = setInterval(() => {
            setRings(prev => {
                const newRings = [...prev];
                newRings[ringIndex] = newRings[ringIndex].map(() => generateRandomChar());
                return newRings;
            });

            intervalCount++;
            if (intervalCount >= 20) {
                clearInterval(interval);

                setRings(prevRings => {
                    const finalRings = [...prevRings];
                    setPassword(prevPassword => {
                        const newPassword = [...prevPassword];
                        const selectedIndices = selectedSlots[ringIndex]
                            .map((selected, index) => selected ? index : -1)
                            .filter(index => index !== -1);
                        newPassword[ringIndex] = selectedIndices.map(index => finalRings[ringIndex][index]).join('');
                        return newPassword;
                    });
                    return finalRings;
                });

                if (ringIndex < settings.rings - 1) {
                    setGeneratingRing(ringIndex + 1);
                    generateRing(ringIndex + 1);
                } else {
                    setGeneratingRing(-1);
                }
            }
        }, 100);
    };

    const generateRandomChar = () => {
        let chars = '';
        if (settings.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (settings.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (settings.numbers) chars += '0123456789';
        if (settings.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        return chars[Math.floor(Math.random() * chars.length)];
    };

    const checkPasswordStrength = (pass: string) => {
        const length = pass.length;
        const hasLower = /[a-z]/.test(pass);
        const hasUpper = /[A-Z]/.test(pass);
        const hasNumber = /\d/.test(pass);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass);

        const strength =
            (length >= 12 ? 1 : 0) +
            (hasLower ? 1 : 0) +
            (hasUpper ? 1 : 0) +
            (hasNumber ? 1 : 0) +
            (hasSpecial ? 1 : 0);

        if (strength < 3) return 'Weak';
        if (strength < 5) return 'Moderate';
        return 'Strong';
    };

    useEffect(() => {
        setPasswordStrength(checkPasswordStrength(password.join('')));
    }, [password]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(password.join('')).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const renderRing = (ringIndex: number, totalRings: number) => {
        const containerSize = 600;
        const centerX = containerSize / 2;
        const centerY = containerSize / 2;
        const maxRadius = (containerSize / 2) - 20;
        const ringSpacing = maxRadius / totalRings;
        const radius = maxRadius - (ringIndex * ringSpacing);

        return rings[ringIndex].map((char, i) => {
            const angle = (i * 360) / rings[ringIndex].length;
            const radians = angle * (Math.PI / 180);
            const x = Math.cos(radians) * radius + centerX;
            const y = Math.sin(radians) * radius + centerY;

            // Define colors for each ring
            const ringColors = [
                'text-blue-400',
                'text-green-400',
                'text-yellow-400',
                'text-purple-400',
                'text-pink-400',
                'text-red-400'
            ];

            return (
                <button
                    key={i}
                    className={`
                    absolute text-base 
                    ${ringColors[ringIndex % ringColors.length]}
                    ${selectedSlots[ringIndex][i] ? 'border-2 border-white scale-100 p-0' : ''}
                    ${generatingRing === ringIndex ? 'animate-pulse' : ''}
                    ${i % 6 === 0 ? 'text-xl' : ''}
                    transition-all duration-200 ease-in-out
                    rounded-full p-1
                `}
                    style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: `rotate(${angle + 90}deg)${selectedSlots[ringIndex][i] ? ' scale(1.0)' : ''}`,
                    }}
                    onClick={() => handleSlotSelect(ringIndex, i)}
                    disabled={generatingRing !== -1}
                >
                    {char}
                </button>
            );
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-800 p-4">
            <div className="mb-4">
                <SettingsMenu onSettingsChange={setSettings}/>
            </div>
            <div className="relative w-full max-w-[600px] aspect-square mb-6">
                {rings.map((_, index) => renderRing(index, settings.rings))}
            </div>
            <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md mb-4"
                onClick={startGeneration}
                disabled={generatingRing !== -1 || !selectedSlots.every(ring => ring.filter(Boolean).length === Math.ceil(settings.length / settings.rings))}
            >
                Generate Password
            </button>
            <div className="text-2xl font-bold mb-2 text-cyan-100">
                Password: {password.join('')}
            </div>
            <div className={`text-lg font-semibold mb-2 ${
                passwordStrength === 'Weak' ? 'text-red-500' :
                    passwordStrength === 'Moderate' ? 'text-yellow-500' :
                        'text-green-500'
            }`}>
                Strength: {passwordStrength}
            </div>
            <button
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md"
                onClick={copyToClipboard}
            >
                {copied ? <CheckCircle2 className="mr-2"/> : <Copy className="mr-2"/>}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
        </div>
    );
};

export default PasswordGenerator;