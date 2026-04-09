'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CheckCircle2, FileText, UserPlus, Shield, Zap, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface S3UploadResponse {
  success: boolean;
  fileUrl: string;
  presignedUrl: string;
  key: string;
  originalName: string;
  clientIp?: string;
  resumeId?: number;
}

export default function HeroSection() {
  const { t, language } = useLanguage();
  const { user, session } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    const validTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(fileExtension)) { alert('Please upload a PDF or DOC file'); return; }
    if (selectedFile.size > 10 * 1024 * 1024) { alert('File size must be less than 10MB'); return; }
    setFile(selectedFile);
    setUploadError(null);
    await handleUpload(selectedFile);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => prev >= 90 ? prev : prev + 10);
    }, 200);

    try {
      const uploadHeaders = new Headers();
      if (session?.access_token) uploadHeaders.set('Authorization', `Bearer ${session.access_token}`);
      const backendHeaders = new Headers({ 'Content-Type': 'application/json' });
      if (session?.access_token) backendHeaders.set('Authorization', `Bearer ${session.access_token}`);

      const formData = new FormData();
      formData.append('file', file);
      const s3Response = await fetch('/api/upload', { method: 'POST', headers: uploadHeaders, body: formData });
      if (!s3Response.ok) { const error = await s3Response.json(); throw new Error(error.error || 'S3 upload failed'); }
      const s3Data: S3UploadResponse = await s3Response.json();

      const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1`).replace(/\/$/, '');
      const backendResponse = await fetch(`${apiBaseUrl}/upload-s3`, {
        method: 'POST', headers: backendHeaders,
        body: JSON.stringify({ s3_key: s3Data.key, s3_url: s3Data.fileUrl, original_filename: s3Data.originalName, file_size: file.size, file_type: file.type, ip_address: s3Data.clientIp }),
      });
      if (!backendResponse.ok) { const error = await backendResponse.json(); throw new Error(error.detail || 'Backend registration failed'); }
      const backendData = await backendResponse.json();

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      setShowSuccessModal(true);

      sessionStorage.setItem('resumeId', backendData.id.toString());
      sessionStorage.setItem('resumeFilename', s3Data.originalName);
      sessionStorage.setItem('resumeFileSize', file.size.toString());
      sessionStorage.setItem('s3Key', s3Data.key);
      sessionStorage.setItem('s3Url', s3Data.fileUrl);
      if (user?.id) sessionStorage.setItem('userId', user.id);

      setTimeout(() => { router.push('/processing?mode=analysis'); }, 1500);
    } catch (error) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      setFile(null);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      console.error('Upload error:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files[0]); };
  const handleButtonClick = () => { fileInputRef.current?.click(); };
  const handleSignUpRedirect = () => { sessionStorage.setItem('pendingUpload', 'true'); setShowSignUpModal(false); router.push('/signup'); };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { handleFileSelect(e.target.files?.[0] || null); };

  return (
    <section className="relative pt-8 pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left column — Text content (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Eyebrow */}
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-brand-blue/[0.06] border border-brand-blue/10 text-brand-blue text-sm font-medium">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green" />
                </span>
                AI-Powered Resume Optimization
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-5 animate-fade-up-delay-1">
              <h1 className={`tracking-tight ${language === 'ur' ? 'text-4xl md:text-5xl leading-[2.2]' : 'text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] leading-[1.08]'}`}>
                <span className="font-normal text-foreground">{t('heroTitleLine1Part1')}</span>
                {t('heroTitleLine1Part2') && t('heroTitleLine1Part2') !== 'heroTitleLine1Part2' && (
                  <>{' '}<span className="font-bold text-foreground">{t('heroTitleLine1Part2')}</span></>
                )}
                <br />
                <span className={`font-bold bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-blue bg-clip-text text-transparent${language === 'ur' ? ' font-almarai' : ''}`}>
                  {t('heroTitleLine2')}
                </span>
              </h1>

              <p className="text-lg md:text-xl leading-relaxed max-w-xl font-normal text-muted-foreground">
                {t('heroSubtitleLine1')}{' '}
                {t('heroSubtitleLine2')}
              </p>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 animate-fade-up-delay-2">
              {[
                { icon: Shield, label: 'ATS Optimized', color: 'text-brand-blue' },
                { icon: Zap, label: 'AI-Powered', color: 'text-brand-yellow' },
                { icon: Award, label: 'Professional', color: 'text-brand-green' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — Upload card (5 cols) */}
          <div className="lg:col-span-5 animate-fade-up-delay-2">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-1 bg-gradient-to-br from-brand-blue/20 via-brand-yellow/10 to-brand-green/10 rounded-3xl blur-xl opacity-60" />

              {/* Card */}
              <div className="relative bg-white rounded-2xl shadow-xl shadow-brand-blue/5 border border-gray-100 p-6">
                {/* Card header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('uploadResume')}</p>
                    <p className="text-xs text-muted-foreground">{t('supportedFormats')}</p>
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center ${
                    isDragging
                      ? 'border-brand-blue bg-brand-blue/5 scale-[1.02]'
                      : isUploading
                      ? 'border-brand-blue/30 bg-brand-blue/[0.02]'
                      : 'border-gray-200 hover:border-brand-blue/40 hover:bg-gray-50/50 cursor-pointer'
                  }`}
                  style={{ minHeight: '180px' }}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileInputChange} className="hidden" />

                  {!isUploading && !file && (
                    <div className="space-y-4">
                      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-blue-muted flex items-center justify-center">
                        <Image src="/assets/upload cloud button.png" alt="Upload" width={32} height={32} className="w-8 h-8 animate-float" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{t('dropResume')}</p>
                        <p className="text-xs text-muted-foreground">{t('supportedFormats')}</p>
                      </div>
                      <Button
                        onClick={handleButtonClick}
                        className="btn-magnetic bg-brand-blue hover:bg-brand-blue-light text-white px-8 py-2.5 h-auto rounded-xl text-sm font-semibold"
                      >
                        {t('uploadResume')}
                      </Button>
                      {uploadError && <p className="text-red-500 text-xs">{uploadError}</p>}
                    </div>
                  )}

                  {isUploading && (
                    <div className="space-y-4 w-full">
                      <FileText className="w-10 h-10 text-brand-blue animate-pulse mx-auto" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Uploading...</p>
                        <Progress value={uploadProgress} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {uploadError && (
                  <div className="mt-3 bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-lg text-xs">
                    {uploadError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Up Modal */}
      <Dialog open={showSignUpModal} onOpenChange={setShowSignUpModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-brand-blue-muted rounded-full flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-brand-blue" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">{t('signUpRequired') || 'Sign Up Required'}</DialogTitle>
            <DialogDescription className="text-center">{t('signUpToUpload')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowSignUpModal(false)} className="flex-1">{t('cancel')}</Button>
            <Button onClick={handleSignUpRedirect} className="flex-1 btn-magnetic bg-brand-blue hover:bg-brand-blue-light text-white">{t('signUpNow')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 animate-fade-in-scale">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-brand-green-light rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-brand-green" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">File Uploaded!</h3>
              <p className="text-muted-foreground text-center">Your resume has been uploaded successfully. Starting processing...</p>
              <div className="w-full bg-brand-blue-muted rounded-full h-1 overflow-hidden">
                <div className="h-full bg-brand-blue rounded-full animate-progress-bar" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
