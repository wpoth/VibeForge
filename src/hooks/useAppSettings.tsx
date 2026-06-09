"use client";

import { useEffect, useState } from "react";

export type AppSettings = {
    reduceAnimations: boolean;
    disableSwipeGestures: boolean;
    compactTrackRows: boolean;
};

const STORAGE_KEY = "vibeforge-app-settings";
const SETTINGS_EVENT = "vibeforge:settings-changed";

export const DEFAULT_APP_SETTINGS: AppSettings = {
    reduceAnimations: false,
    disableSwipeGestures: false,
    compactTrackRows: false,
};

function applySettingsToDocument(settings: AppSettings) {
    if (typeof document === "undefined") return;

    document.documentElement.dataset.reduceMotion = String(
        settings.reduceAnimations
    );
    document.documentElement.dataset.compactTrackRows = String(
        settings.compactTrackRows
    );
    document.documentElement.dataset.disableSwipeGestures = String(
        settings.disableSwipeGestures
    );
}

function readSettings(): AppSettings {
    if (typeof window === "undefined") {
        return DEFAULT_APP_SETTINGS;
    }

    try {
        const rawSettings = window.localStorage.getItem(STORAGE_KEY);

        if (!rawSettings) {
            return DEFAULT_APP_SETTINGS;
        }

        const parsed = JSON.parse(rawSettings) as Partial<AppSettings>;

        return {
            ...DEFAULT_APP_SETTINGS,
            ...parsed,
        };
    } catch {
        return DEFAULT_APP_SETTINGS;
    }
}

function writeSettings(settings: AppSettings) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applySettingsToDocument(settings);

    window.dispatchEvent(
        new CustomEvent<AppSettings>(SETTINGS_EVENT, {
            detail: settings,
        })
    );
}

export function useAppSettings() {
    const [settings, setSettingsState] =
        useState<AppSettings>(DEFAULT_APP_SETTINGS);

    useEffect(() => {
        const nextSettings = readSettings();

        setSettingsState(nextSettings);
        applySettingsToDocument(nextSettings);

        function handleSettingsChanged(event: Event) {
            const customEvent = event as CustomEvent<AppSettings>;

            setSettingsState(customEvent.detail ?? readSettings());
        }

        window.addEventListener(SETTINGS_EVENT, handleSettingsChanged);

        return () => {
            window.removeEventListener(SETTINGS_EVENT, handleSettingsChanged);
        };
    }, []);

    function setSetting<Key extends keyof AppSettings>(
        key: Key,
        value: AppSettings[Key]
    ) {
        const nextSettings = {
            ...settings,
            [key]: value,
        };

        setSettingsState(nextSettings);
        writeSettings(nextSettings);
    }

    function resetSettings() {
        setSettingsState(DEFAULT_APP_SETTINGS);
        writeSettings(DEFAULT_APP_SETTINGS);
    }

    return {
        settings,
        setSetting,
        resetSettings,
    };
}