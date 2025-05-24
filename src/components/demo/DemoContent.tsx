'use client';

import { Gallery } from '@/components/demo/Gallery';
import { HairstyleSelector } from '@/components/demo/HairstyleSelector';
import { ImagePicker } from '@/components/demo/ImagePicker';
import { ImagePreview } from '@/components/demo/ImagePreview';
import { LoadingState } from '@/components/demo/LoadingState';
import { ResultView } from '@/components/demo/ResultView';
import { useTextToImageContext } from '@/contexts/TextToImageContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useState } from 'react';
import { Button } from '../ui/button';

const hairstyles = [
  {
    imageUrl: '/images/hairstyles/1.jpeg',
    prompt: '',
  },
  {
    imageUrl: '/images/hairstyles/2.jpeg',
    prompt: '',
  },
  {
    imageUrl: '/images/hairstyles/3.jpeg',
    prompt: '',
  },
  {
    imageUrl: '/images/hairstyles/4.jpeg',
    prompt: '',
  },
  {
    imageUrl: '/images/hairstyles/5.jpeg',
    prompt: '',
  },
  {
    imageUrl: '/images/hairstyles/6.jpeg',
    prompt: '',
  },
  {
    imageUrl: '/images/hairstyles/7.jpeg',
    prompt: '',
  },
  {
    imageUrl: '/images/hairstyles/8.jpeg',
    prompt: '',
  },
  {
    imageUrl: '/images/hairstyles/9.jpeg',
    prompt: '',
  },
];

export function DemoContent() {
  const { image, imagePreview, handleImageSelection, resetImage, uploadedImageId } =
    useImageUpload();
  const { isLoading, results, error, generateImage, resetResults } = useTextToImageContext();
  const [selectedHairstyle, setSelectedHairstyle] = useState<number>(-1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const index = selectedHairstyle - 1;
    const hairstyleData = hairstyles[index];

    if (image && hairstyleData) {
      generateImage(
        image,
        hairstyleData.imageUrl,
        hairstyleData.prompt,
        selectedHairstyle,
        uploadedImageId || undefined
      );
    }
  };

  const handleReset = () => {
    resetResults();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto flex flex-col items-center gap-2.5">
        <h2 className="text-foreground text-3xl font-normal sm:text-4xl">
          Hair Makeover Generator
        </h2>
        <p className="text-muted-foreground text-base font-normal sm:text-lg">
          Try out different hairstyles with just one selfie.
        </p>
      </div>

      <div className="border-border bg-card flex flex-col rounded-lg border">
        {isLoading ? (
          <LoadingState onCancel={() => handleReset()} />
        ) : (
          <>
            {results.length > 0 ? (
              <ResultView results={results} onReset={handleReset} />
            ) : (
              <>
                <div className="flex h-full flex-col items-center justify-between py-8 md:flex-row">
                  <div className="mb-8 flex w-full flex-1 flex-col gap-4 px-6 md:mb-0 md:w-auto md:px-12">
                    <p className="text-foreground text-center text-xs font-medium uppercase">
                      Add a selfie
                    </p>
                    {imagePreview ? (
                      <ImagePreview imageUrl={imagePreview} onClear={resetImage} />
                    ) : (
                      <ImagePicker onImageSelected={handleImageSelection} />
                    )}
                  </div>
                  <div className="border-border flex w-full flex-1 flex-col gap-4 px-6 md:w-auto md:border-l md:px-12">
                    <p className="text-foreground text-center text-xs font-medium uppercase">
                      Select hairstyle
                    </p>
                    <HairstyleSelector onSelect={setSelectedHairstyle} />
                  </div>
                </div>

                <div className="border-border flex justify-end border-t px-4 py-4 sm:px-8">
                  <Button
                    onClick={handleSubmit}
                    disabled={!image || selectedHairstyle === -1}
                    className="w-full sm:w-auto"
                  >
                    Generate
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="border-border bg-destructive/10 border-destructive/20 flex flex-col rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="text-destructive">⚠️</div>
            <h3 className="text-destructive font-medium">Generation Failed</h3>
          </div>
          <p className="text-destructive/80 mt-2 text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={resetResults}
            className="mt-3 w-fit self-start"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Gallery Section */}
      <div className="border-border bg-card flex flex-col rounded-lg border p-6">
        <Gallery />
      </div>
    </div>
  );
}
