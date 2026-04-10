'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLLMConfig, updateLLMConfig, LLMConfig, LLMProvider, getOCRConfig, updateOCRConfig, OCRConfig, OCRMethod, OCRProvider } from '@/lib/admin-api';
import { toast } from 'sonner';
import { Loader2, Save, Settings as SettingsIcon, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { t, language } = useLanguage();
  const isArabic = language === 'ur';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [provider, setProvider] = useState<LLMProvider>('anthropic');
  const [model, setModel] = useState('');
  const [maxTokens, setMaxTokens] = useState(8000);

  const [ocrConfig, setOcrConfig] = useState<OCRConfig | null>(null);
  const [ocrOptProvider, setOcrOptProvider] = useState<OCRProvider>('custom');
  const [ocrEvaluation, setOcrEvaluation] = useState<OCRMethod>('local');
  const [ocrEvalProvider, setOcrEvalProvider] = useState<OCRProvider>('custom');
  const [savingOcr, setSavingOcr] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchOCRConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getLLMConfig();
      setConfig(data);
      setProvider(data.provider);
      setModel(data.model);
      setMaxTokens(data.max_tokens);
    } catch (error) {
      console.error('Failed to fetch LLM config:', error);
      toast.error(t('admin.settings.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const fetchOCRConfig = async () => {
    try {
      const data = await getOCRConfig();
      setOcrConfig(data);
      setOcrOptProvider(data.cv_optimization_provider);
      setOcrEvaluation(data.cv_evaluation);
      if (data.cv_evaluation_provider) setOcrEvalProvider(data.cv_evaluation_provider);
    } catch (error) {
      console.error('Failed to fetch OCR config:', error);
    }
  };

  const handleSaveOCR = async () => {
    try {
      setSavingOcr(true);
      const updated = await updateOCRConfig(
        ocrOptProvider,
        ocrEvaluation,
        ocrEvaluation === 'ai' ? ocrEvalProvider : undefined
      );
      setOcrConfig(updated);
      toast.success('OCR settings saved successfully');
    } catch (error: any) {
      console.error('Failed to update OCR config:', error);
      toast.error(error?.message || 'Failed to save OCR settings');
    } finally {
      setSavingOcr(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateLLMConfig(provider, model);
      // Update config with the values we just saved
      setConfig({
        ...updated,
        provider: provider,
        model: model,
        max_tokens: maxTokens,
      });
      toast.success(t('admin.settings.saved'));
    } catch (error) {
      console.error('Failed to update LLM config:', error);
      toast.error(t('admin.settings.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const anthropicModels = [
    'claude-sonnet-4-20250514',
    'claude-sonnet-4-5-20250929',
    'claude-opus-4-5-20251101',
    'claude-haiku-4-5-20251001',
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];

  const openaiModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ];

  const customModels = [
    'gemma4:31b',
  ];

  const availableModels = provider === 'anthropic' ? anthropicModels : provider === 'custom' ? customModels : openaiModels;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <SettingsIcon className="w-5 h-5" />
            <CardTitle className={isArabic ? 'text-right' : ''}>{t('admin.settings.llmConfiguration')}</CardTitle>
          </div>
          <CardDescription className={isArabic ? 'text-right' : ''}>
            {t('admin.settings.llmDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isArabic ? 'text-right' : ''}`}>
              {t('admin.settings.provider')}
            </label>
            <select
              value={provider}
              onChange={(e) => {
                const newProvider = e.target.value as LLMProvider;
                setProvider(newProvider);
                // Reset model when provider changes
                const models = newProvider === 'anthropic' ? anthropicModels : openaiModels;
                setModel(models[0]);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="custom">Custom (Gemma 4)</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isArabic ? 'text-right' : ''}`}>
              {t('admin.settings.model')}
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${isArabic ? 'text-right' : ''}`}
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <p className={`mt-1 text-xs text-gray-500 ${isArabic ? 'text-right' : ''}`}>
              {provider === 'anthropic'
                ? t('admin.settings.claudeDescription')
                : provider === 'custom'
                ? (t('admin.settings.customDescription') || 'Self-hosted model via Ollama endpoint')
                : t('admin.settings.gptDescription')}
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isArabic ? 'text-right' : ''}`}>
              {t('admin.settings.maxTokens')}
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8000)}
              min={1000}
              max={32000}
              step={1000}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${isArabic ? 'text-right' : ''}`}
              dir={isArabic ? 'rtl' : 'ltr'}
            />
            <p className={`mt-1 text-xs text-gray-500 ${isArabic ? 'text-right' : ''}`}>
              {t('admin.settings.maxTokensDescription')}
            </p>
          </div>

          <div className={`flex gap-4 pt-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={handleSave}
              disabled={saving || !model}
              className="bg-brand-blue hover:bg-brand-blue-light"
            >
              {saving ? (
                <>
                  <Loader2 className={`w-4 h-4 ${isArabic ? 'ml-2' : 'mr-2'} animate-spin`} />
                  {t('admin.settings.saving')}
                </>
              ) : (
                <>
                  <Save className={`w-4 h-4 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                  {t('admin.settings.saveSettings')}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={fetchConfig}
              disabled={saving}
            >
              {t('admin.settings.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {config && (
        <Card>
          <CardHeader>
            <CardTitle className={isArabic ? 'text-right' : ''}>{t('admin.settings.currentConfiguration')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-2 text-sm ${isArabic ? 'text-right' : ''}`}>
              <div className={`flex ${isArabic ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                <span className="text-gray-600">{t('admin.settings.provider')}:</span>
                <span className="font-medium">{config.provider}</span>
              </div>
              <div className={`flex ${isArabic ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                <span className="text-gray-600">{t('admin.settings.model')}:</span>
                <span className="font-medium">{config.model}</span>
              </div>
              <div className={`flex ${isArabic ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                <span className="text-gray-600">{t('admin.settings.maxTokens')}:</span>
                <span className="font-medium">{config.max_tokens}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OCR Configuration */}
      <Card>
        <CardHeader>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <ScanText className="w-5 h-5" />
            <CardTitle className={isArabic ? 'text-right' : ''}>OCR Configuration</CardTitle>
          </div>
          <CardDescription className={isArabic ? 'text-right' : ''}>
            Configure text extraction method for each pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isArabic ? 'text-right' : ''}`}>
              CV Optimization OCR Provider
            </label>
            <select
              value={ocrOptProvider}
              onChange={(e) => setOcrOptProvider(e.target.value as OCRProvider)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              {(!ocrConfig || ocrConfig.available_providers.includes('custom')) && (
                <option value="custom">Custom LLM ({ocrConfig?.cv_optimization_model || 'gemma4:31b'})</option>
              )}
              {(!ocrConfig || ocrConfig.available_providers.includes('openai')) && (
                <option value="openai">OpenAI Vision (gpt-4o)</option>
              )}
            </select>
            <p className={`mt-1 text-xs text-gray-500 ${isArabic ? 'text-right' : ''}`}>
              AI vision model used for text extraction in the resume optimization pipeline
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isArabic ? 'text-right' : ''}`}>
              CV Evaluation OCR
            </label>
            <select
              value={ocrEvaluation}
              onChange={(e) => setOcrEvaluation(e.target.value as OCRMethod)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="ai">AI-Powered</option>
              <option value="local">Local (pdfplumber / python-docx)</option>
            </select>
            <p className={`mt-1 text-xs text-gray-500 ${isArabic ? 'text-right' : ''}`}>
              Used when extracting text from CVs in the candidate evaluation pipeline
            </p>
          </div>

          {ocrEvaluation === 'ai' && (
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isArabic ? 'text-right' : ''}`}>
                CV Evaluation OCR Provider
              </label>
              <select
                value={ocrEvalProvider}
                onChange={(e) => setOcrEvalProvider(e.target.value as OCRProvider)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                {(!ocrConfig || ocrConfig.available_providers.includes('custom')) && (
                  <option value="custom">Custom LLM ({ocrConfig?.cv_optimization_model || 'gemma4:31b'})</option>
                )}
                {(!ocrConfig || ocrConfig.available_providers.includes('openai')) && (
                  <option value="openai">OpenAI Vision (gpt-4o)</option>
                )}
              </select>
              <p className={`mt-1 text-xs text-gray-500 ${isArabic ? 'text-right' : ''}`}>
                Select which AI vision model to use for evaluation OCR
              </p>
            </div>
          )}

          <div className={`flex gap-4 pt-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={handleSaveOCR}
              disabled={savingOcr}
              className="bg-brand-blue hover:bg-brand-blue-light"
            >
              {savingOcr ? (
                <>
                  <Loader2 className={`w-4 h-4 ${isArabic ? 'ml-2' : 'mr-2'} animate-spin`} />
                  Saving...
                </>
              ) : (
                <>
                  <Save className={`w-4 h-4 ${isArabic ? 'ml-2' : 'mr-2'}`} />
                  Save OCR Settings
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={fetchOCRConfig}
              disabled={savingOcr}
            >
              {t('admin.settings.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {ocrConfig && (
        <Card>
          <CardHeader>
            <CardTitle className={isArabic ? 'text-right' : ''}>Current OCR Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-2 text-sm ${isArabic ? 'text-right' : ''}`}>
              <div className={`flex ${isArabic ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                <span className="text-gray-600">CV Optimization Provider:</span>
                <span className="font-medium">{ocrConfig.cv_optimization_provider === 'custom' ? 'Custom LLM' : 'OpenAI Vision'}</span>
              </div>
              <div className={`flex ${isArabic ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                <span className="text-gray-600">CV Optimization Model:</span>
                <span className="font-medium">{ocrConfig.cv_optimization_model}</span>
              </div>
              <div className={`flex ${isArabic ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                <span className="text-gray-600">CV Evaluation:</span>
                <span className="font-medium">
                  {ocrConfig.cv_evaluation === 'ai'
                    ? `AI-Powered (${ocrConfig.cv_evaluation_provider === 'custom' ? 'Custom LLM' : 'OpenAI Vision'})`
                    : 'Local'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

