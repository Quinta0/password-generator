"use client";

import { useState, useEffect } from 'react';
import { SettingsMenu, PasswordSettings } from "@/components/SettingsMenu";
import { CheckCircle2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
    const [password, setPassword] = useState<string>('');
    const [passwordStrength, setPasswordStrength] = useState('');
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hoveredRing, setHoveredRing] = useState<number | null>(null);

    useEffect(() => {
        initializeRings();
    }, [settings]);


    const initializeRings = () => {
        const newRings = Array.from({ length: settings.rings }, () => generateRingCharacters());
        const newSelectedSlots = Array.from({ length: settings.rings }, () => Array(26).fill(false));
        setRings(newRings);
        setSelectedSlots(newSelectedSlots);
    };

    const generateRingCharacters = () => {
        let chars = '';
        if (settings.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (settings.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (settings.numbers) chars += '0123456789';
        if (settings.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        return Array.from({ length: 26 }, () => generateSecureRandomChar(chars));
    };

    const generateSecureRandomChar = (chars: string) => {
        const array = new Uint8Array(1);
        crypto.getRandomValues(array);
        return chars[array[0] % chars.length];
    };

    const generatePassword = async () => {
        setIsGenerating(true);
        const charsPerRing = Math.ceil(settings.length / settings.rings);
        let newPassword = '';
        const newSelectedSlots = rings.map(() => Array(26).fill(false));

        for (let ringIndex = 0; ringIndex < rings.length; ringIndex++) {
            // Rotate and update characters
            for (let i = 0; i < 20; i++) {
                const newRing = generateRingCharacters();
                setRings(prev => {
                    const newRings = [...prev];
                    newRings[ringIndex] = newRing;
                    return newRings;
                });
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Select characters for the password
            const selectedIndices = selectRandomIndices(26, charsPerRing);
            for (const index of selectedIndices) {
                newSelectedSlots[ringIndex][index] = true;
                setSelectedSlots([...newSelectedSlots]);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // Generate the password from the final state of the rings and selected slots
        setRings(currentRings => {
            newPassword = currentRings.flatMap((ring, ringIndex) =>
                ring.filter((_, index) => newSelectedSlots[ringIndex][index])
            ).join('').slice(0, settings.length);

            setPassword(newPassword);
            setPasswordStrength(checkPasswordStrength(newPassword));
            return currentRings;
        });

        setIsGenerating(false);
    };

    const selectRandomIndices = (length: number, count: number) => {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array)
            .map((value, index) => ({ value, index }))
            .sort((a, b) => a.value - b.value)
            .slice(0, count)
            .map(({ index }) => index);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(password).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const [rotation, setRotation] = useState(() => {
        const initialRotation = {};
        for (let i = 0; i < settings.rings; i++) {
            // @ts-ignore
            initialRotation[i] = 0;
        }
        return initialRotation;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setRotation(prev => {
                const newRotation = {...prev};
                for (let i = 0; i < settings.rings; i++) {
                    if (i === hoveredRing) {
                        // Slower rotation for hovered ring
                        // @ts-ignore
                        newRotation[i] = (prev[i] || 0) + 0.5;
                    } else {
                        // Normal rotation for other rings
                        // @ts-ignore
                        newRotation[i] = (prev[i] || 0) + 1;
                    }
                    // @ts-ignore
                    newRotation[i] %= 360;
                }
                return newRotation;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [hoveredRing, settings.rings]);

    const renderRing = (ringIndex: number, totalRings: number) => {
        const ringColors = [
            'text-blue-400', 'text-green-400', 'text-yellow-400',
            'text-purple-400', 'text-pink-400', 'text-red-400'
        ];

        return (
            <div
                className="absolute inset-0"
                onMouseEnter={() => setHoveredRing(ringIndex)}
                onMouseLeave={() => setHoveredRing(null)}
            >
                {rings[ringIndex].map((char, i) => {
                    // @ts-ignore
                    const angle = ((i * 360) / rings[ringIndex].length + rotation[ringIndex]) % 360;
                    const radians = angle * (Math.PI / 180);
                    const radius = 50 - (ringIndex * (50 / totalRings));
                    const x = Math.cos(radians) * radius + 50;
                    const y = Math.sin(radians) * radius + 50;

                    return (
                        <div
                            key={i}
                            className={`
                            absolute text-xs sm:text-sm md:text-base font-bold 
                            ${ringColors[ringIndex % ringColors.length]}
                            transition-all duration-200 ease-in-out
                            rounded-full p-0.5 sm:p-1
                            ${selectedSlots[ringIndex][i] ? 'border border-white scale-110' : ''}
                        `}
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                            }}
                        >
                            {char}
                        </div>
                    );
                })}
            </div>
        );
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

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md mb-4 flex justify-center">
                    <SettingsMenu onSettingsChange={setSettings}/>
                </div>
                <div className="relative w-full max-w-[90vmin] aspect-square mb-6">
                    {rings.map((_, index) => renderRing(index, settings.rings))}
                </div>
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-md mb-4 text-sm sm:text-base"
                    onClick={generatePassword}
                    disabled={isGenerating}
                >
                    {isGenerating ? 'Generating...' : 'Generate Password'}
                </button>
                <div className="text-lg sm:text-xl md:text-2xl font-bold mb-2 text-cyan-100 text-center">
                    Password: {password}
                </div>
                <div className={`text-base sm:text-lg font-semibold mb-2 ${
                    passwordStrength === 'Weak' ? 'text-red-500' :
                        passwordStrength === 'Moderate' ? 'text-yellow-500' :
                            'text-green-500'
                }`}>
                    Strength: {passwordStrength}
                </div>
                <button
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md text-sm sm:text-base"
                    onClick={copyToClipboard}
                >
                    {copied ? <CheckCircle2 className="mr-2"/> : <Copy className="mr-2"/>}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
            </main>
            <footer className="bg-zinc-800 text-muted-foreground py-6">
                <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between">
                    <p className="text-sm mb-4 sm:mb-0">&copy; 2024 Quintavalle Pietro. All rights reserved.</p>
                    <nav className="flex items-center gap-4">
                        <Dialog>
                            <DialogTrigger className="text-sm">Licence</DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>MIT License</DialogTitle>
                                    <DialogDescription>
                                        <p className="font-bold">Copyright (c) 2024 Quintavalle Pietro</p>
                                        <p className="mt-2">
                                            Permission is hereby granted, free of charge, to any person obtaining a copy
                                            of this software and associated documentation files
                                            (the &quot;Software&quot;), to deal
                                            in the Software without restriction, including without limitation the rights
                                            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                                            copies of the Software, and to permit persons to whom the Software is
                                            furnished to do so, subject to the following conditions:
                                        </p>
                                        <p>
                                            The above copyright notice and this permission notice shall be included in
                                            all
                                            copies or substantial portions of the Software.
                                        </p>
                                        <p className="mt-2">
                                            THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND,
                                            EXPRESS OR
                                            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                                            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                                            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                                            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
                                            FROM,
                                            OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
                                            THE
                                            SOFTWARE.
                                        </p>
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                        <a href="https://github.com/Quinta0" target="_blank" rel="noopener noreferrer"
                           className="hover:underline">
                            <GitHubIcon className="w-6 h-6"/>
                        </a>
                        <a href="mailto:0pietroquintavalle0@gmail.com" className="hover:underline">
                            <GmailIcon className="w-6 h-6"/>
                        </a>
                        <a href="https://www.linkedin.com/in/pietro-quintavalle-996b96267/" target="_blank"
                           rel="noopener noreferrer" className="hover:underline">
                            <LinkedInIcon className="w-6 h-6"/>
                        </a>
                    </nav>
                </div>
            </footer>
        </div>
    );
};

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0"
        >
            <path
                d="M12 .5C5.48.5.5 5.48.5 12c0 5.08 3.29 9.35 7.85 10.86.58.1.79-.24.79-.54 0-.27-.01-.99-.01-1.94-3.19.69-3.86-1.54-3.86-1.54-.53-1.36-1.29-1.72-1.29-1.72-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.69 1.26 3.34.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.45.12-3.02 0 0 .97-.31 3.17 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.2-1.49 3.17-1.18 3.17-1.18.64 1.57.24 2.73.12 3.02.75.81 1.2 1.84 1.2 3.1 0 4.46-2.69 5.43-5.25 5.71.41.35.78 1.03.78 2.08 0 1.5-.01 2.72-.01 3.08 0 .3.21.65.8.54C20.71 21.35 24 17.08 24 12c0-6.52-4.98-11.5-12-11.5z"/>
        </svg>
    )
}

function GmailIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0"
        >
            <path
                d="M12 12.713l11.985-8.677a.868.868 0 0 0-.491-.148H.506c-.177 0-.344.055-.491.148L12 12.713zm0 1.431L.035 5.596A.875.875 0 0 0 0 6.125v11.75c0 .478.387.875.875.875h22.25c.478 0 .875-.387.875-.875V6.125a.875.875 0 0 0-.035-.529L12 14.144z"/>
        </svg>
    )
}

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0"
        >
            <path
                d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.5c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.5h-3v-5.5c0-1.379-1.121-2.5-2.5-2.5s-2.5 1.121-2.5 2.5v5.5h-3v-11h3v1.474c.809-1.161 2.201-1.974 3.5-1.974 2.481 0 4.5 2.019 4.5 4.5v7z"/>
        </svg>
    )
}

export default PasswordGenerator;