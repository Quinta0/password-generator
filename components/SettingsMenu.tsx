// components/SettingsMenu.tsx
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

type SettingsProps = {
    onSettingsChange: (settings: PasswordSettings) => void;
};

export type PasswordSettings = {
    length: number;
    rings: number;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
};

export function SettingsMenu({ onSettingsChange }: SettingsProps) {
    const [settings, setSettings] = useState<PasswordSettings>({
        length: 12,
        rings: 4,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
    });

    const updateSettings = (newSettings: Partial<PasswordSettings>) => {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);
        onSettingsChange(updatedSettings);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md">Settings</button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Password Length: {settings.length}</h4>
                        <Slider
                            min={4}
                            max={32}
                            step={1}
                            value={[settings.length]}
                            onValueChange={([value]) => updateSettings({ length: value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Number of Rings: {settings.rings}</h4>
                        <Slider
                            min={2}
                            max={6}
                            step={1}
                            value={[settings.rings]}
                            onValueChange={([value]) => updateSettings({ rings: value })}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="uppercase"
                            checked={settings.uppercase}
                            onCheckedChange={(checked) => updateSettings({ uppercase: checked })}
                        />
                        <label htmlFor="uppercase">Include Uppercase</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="lowercase"
                            checked={settings.lowercase}
                            onCheckedChange={(checked) => updateSettings({ lowercase: checked })}
                        />
                        <label htmlFor="lowercase">Include Lowercase</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="numbers"
                            checked={settings.numbers}
                            onCheckedChange={(checked) => updateSettings({ numbers: checked })}
                        />
                        <label htmlFor="numbers">Include Numbers</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="symbols"
                            checked={settings.symbols}
                            onCheckedChange={(checked) => updateSettings({ symbols: checked })}
                        />
                        <label htmlFor="symbols">Include Symbols</label>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}