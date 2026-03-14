'use client';

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useApiKey } from './ApiKeyGate';
import { Upload, Video, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const DEFAULT_PROMPT = `Toma cinematográfica publicitaria de un letrero luminoso 3D en fachada nocturna, manteniendo EXACTAMENTE el diseño original sin modificar tipografía, colores o iluminación. Cámara acercándose suavemente hacia las letras iluminadas, con reflejos sutiles en materiales acrílicos/metálicos, profundidad de campo cinematográfica, iluminación ambiental realista. Estilo comercial premium, movimiento suave, 4K, 5 segundos.

PRONT NEGATIVO: Diseño alterado, tipografía cambiada, logotipo modificado, colores diferentes, elementos añadidos o eliminados, escena reinventada, movimiento exagerado, efectos artificiales, distorsiones, baja calidad, sobreprocesado, fondos inconsistentes.`;

export default function VideoGenerator() {
  const { resetApiKey } = useApiKey();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setVideoUrl(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setVideoUrl(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, part
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const generateVideo = async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setProgressMsg('Initializing generation...');

    try {
      const base64Image = await fileToBase64(imageFile);
      
      // Create a new instance right before the call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      setProgressMsg('Uploading image and starting generation...');
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
          imageBytes: base64Image,
          mimeType: imageFile.type,
        },
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: aspectRatio
        }
      });

      setProgressMsg('Generation in progress. This may take a few minutes...');

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        setProgressMsg('Still generating... Please wait.');
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      if (operation.error) {
        throw new Error((operation.error as any).message || 'Unknown generation error');
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (!downloadLink) {
        throw new Error('No video URL returned from the API.');
      }

      setProgressMsg('Downloading generated video...');

      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': process.env.API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setVideoUrl(url);
      setProgressMsg('');
      
    } catch (err: any) {
      console.error('Generation error:', err);
      const errorMessage = err.message || String(err);
      
      if (errorMessage.includes('Requested entity was not found')) {
        setError('API Key error. Please select your API key again.');
        resetApiKey();
      } else {
        setError(`Generation failed: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100 mb-4">Luminous Sign Video Generator</h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Transform a simple photo of a luminous sign into a professional, cinematic 5-second commercial video using AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-500" />
              1. Upload Image
            </h2>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${imagePreview ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={handleImageChange}
              />
              
              {imagePreview ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white font-medium flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Change Image
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="text-zinc-300 font-medium mb-1">Click or drag image here</p>
                  <p className="text-zinc-500 text-sm">JPG, PNG, or WebP</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-emerald-500" />
              2. Video Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Aspect Ratio</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${aspectRatio === '16:9' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}>
                    <input type="radio" name="aspectRatio" value="16:9" checked={aspectRatio === '16:9'} onChange={() => setAspectRatio('16:9')} className="hidden" />
                    <div className="w-6 h-4 border-2 border-current rounded-sm"></div>
                    16:9 (Landscape)
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${aspectRatio === '9:16' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}>
                    <input type="radio" name="aspectRatio" value="9:16" checked={aspectRatio === '9:16'} onChange={() => setAspectRatio('9:16')} className="hidden" />
                    <div className="w-4 h-6 border-2 border-current rounded-sm"></div>
                    9:16 (Portrait)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Prompt (Principal y Negativo)</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={generateVideo}
            disabled={!imageFile || isGenerating}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                Generate Commercial Video
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Result
          </h2>
          
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden relative min-h-[400px]">
            {videoUrl ? (
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-contain"
              />
            ) : isGenerating ? (
              <div className="flex flex-col items-center text-center p-6">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <p className="text-zinc-300 font-medium">{progressMsg}</p>
                <p className="text-zinc-500 text-sm mt-2 max-w-xs">
                  Video generation can take a few minutes. Please don&apos;t close this tab.
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center text-center p-6 text-red-400">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="font-medium">{error}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-6 text-zinc-600">
                <Video className="w-16 h-16 mb-4 opacity-20" />
                <p>Your generated video will appear here.</p>
              </div>
            )}
          </div>
          
          {videoUrl && (
            <div className="mt-4 flex justify-end">
              <a 
                href={videoUrl} 
                download="luminous-sign-commercial.mp4"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
              >
                Download Video
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
