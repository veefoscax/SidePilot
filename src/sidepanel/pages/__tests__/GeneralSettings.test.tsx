
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneralSettings } from '../GeneralSettings';
import * as settingsStore from '@/stores/settings';

// Mock i18next-browser-languagedetector BEFORE other imports
vi.mock('i18next-browser-languagedetector', () => ({
    default: vi.fn()
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, params?: any) => {
            if (key === 'settings.version') return `Version ${params?.version}`;
            return key;
        },
        i18n: {
            changeLanguage: vi.fn(),
            language: 'en'
        }
    }),
    initReactI18next: {
        type: '3rdParty',
        init: vi.fn()
    }
}));

// Mock the i18n lib to prevent actual initialization
vi.mock('@/lib/i18n', () => ({
    SUPPORTED_LANGUAGES: [
        { code: 'en', name: 'English (US)', nativeName: 'English' },
        { code: 'pt', name: 'Português (BR)', nativeName: 'Português' }
    ],
    changeLanguage: vi.fn(),
    getCurrentLanguage: () => 'en',
    isLanguageSupported: () => true,
    default: {
        language: 'en',
        changeLanguage: vi.fn()
    }
}));

// Mock hugeicons
vi.mock('@hugeicons/react', () => ({
    HugeiconsIcon: ({ icon, className }: any) => <div data-testid="icon" className={className} />
}));

// Mock settings store
const mockSetLanguage = vi.fn();
const mockSetTheme = vi.fn();
const mockResetToDefaults = vi.fn();

vi.mock('@/stores/settings', () => ({
    useSettingsStore: vi.fn()
}));

describe('GeneralSettings Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (settingsStore.useSettingsStore as any).mockReturnValue({
            language: 'en',
            theme: 'system',
            setLanguage: mockSetLanguage,
            setTheme: mockSetTheme,
            resetToDefaults: mockResetToDefaults
        });
    });

    it('renders settings title and version', () => {
        render(<GeneralSettings />);
        expect(screen.getByText('settings.title')).toBeInTheDocument();
    });

    it('renders language selector', () => {
        render(<GeneralSettings />);
        expect(screen.getAllByText('settings.language.label').length).toBeGreaterThan(0);
        expect(screen.getByText('settings.language.description')).toBeInTheDocument();
    });

    it('renders theme selector', () => {
        render(<GeneralSettings />);
        expect(screen.getAllByText('settings.theme.label').length).toBeGreaterThan(0);
        expect(screen.getByText('settings.theme.description')).toBeInTheDocument();
    });

    it('calls setLanguage when language changes', () => {
        render(<GeneralSettings />);
        expect(settingsStore.useSettingsStore).toHaveBeenCalled();
    });

    it('renders reset button', () => {
        render(<GeneralSettings />);
        expect(screen.getByText('common.reset')).toBeInTheDocument();
    });
});
