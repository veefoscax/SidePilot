/**
 * General Settings Page
 * 
 * Provides UI for managing application-wide settings:
 * - Language selection (English/Portuguese)
 * - Theme selection (System/Light/Dark)
 * - Reset to defaults with confirmation
 * - Version info display
 * 
 * Requirements: AC2
 */

import { useTranslation } from 'react-i18next';
import { useSettingsStore, type Theme } from '@/stores/settings';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Globe02Icon, 
  PaintBrushIcon, 
  RefreshIcon,
  InformationCircleIcon
} from '@hugeicons/core-free-icons';

/**
 * Get the extension version from manifest
 */
function getExtensionVersion(): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
      return chrome.runtime.getManifest().version;
    }
  } catch (error) {
    console.warn('[GeneralSettings] Could not get extension version:', error);
  }
  return '0.0.0';
}

export function GeneralSettings() {
  const { t } = useTranslation();
  const { language, theme, setLanguage, setTheme, resetToDefaults } = useSettingsStore();
  
  const version = getExtensionVersion();
  
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('settings.version', { version })}
        </p>
      </div>
      
      {/* Language Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon icon={Globe02Icon} className="h-5 w-5 text-primary" />
            {t('settings.language.label')}
          </CardTitle>
          <CardDescription>
            {t('settings.language.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language-select" className="text-sm">
              {t('settings.language.label')}
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language-select" className="w-full">
                <SelectValue placeholder={t('settings.language.label')} />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Theme Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon icon={PaintBrushIcon} className="h-5 w-5 text-primary" />
            {t('settings.theme.label')}
          </CardTitle>
          <CardDescription>
            {t('settings.theme.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="theme-select" className="text-sm">
              {t('settings.theme.label')}
            </Label>
            <Select 
              value={theme} 
              onValueChange={(value) => setTheme(value as Theme)}
            >
              <SelectTrigger id="theme-select" className="w-full">
                <SelectValue placeholder={t('settings.theme.label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">{t('settings.theme.system')}</SelectItem>
                <SelectItem value="light">{t('settings.theme.light')}</SelectItem>
                <SelectItem value="dark">{t('settings.theme.dark')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Separator />
      
      {/* Reset to Defaults */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 mr-2" />
            {t('common.reset')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.resetConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.resetConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={resetToDefaults}>
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Version Info */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
        <HugeiconsIcon icon={InformationCircleIcon} className="h-3 w-3" />
        <span>SidePilot v{version}</span>
      </div>
    </div>
  );
}

export default GeneralSettings;
