import { Button } from '@/components/ui/button';
import { useGalleryRefresh } from '@/contexts/GalleryRefreshContext';
import { useTextToImageContext } from '@/contexts/TextToImageContext';
import { saveGeneratedImage } from '@/hooks/useSaveGeneratedImage';
import React from 'react';

type ResultViewProps = {
  results: string[];
  onReset: () => void;
};

export function ResultView({ results, onReset }: ResultViewProps) {
  const { currentOriginalImageId, currentHairstyleIndex } = useTextToImageContext();
  const { triggerRefresh } = useGalleryRefresh();
  const [savedResultsHash, setSavedResultsHash] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);

  // Save generated images when results are available
  React.useEffect(() => {
    // Create a hash of the current results to prevent duplicate saves
    const resultsHash =
      results.join('|') + '|' + currentHairstyleIndex + '|' + (currentOriginalImageId || 'null');

    console.log('🖼️ ResultView: Checking if should save generated images:', {
      resultsCount: results.length,
      currentOriginalImageId,
      currentHairstyleIndex,
      hasResults: results.length > 0,
      hasOriginalId: !!currentOriginalImageId,
      hasValidHairstyle: currentHairstyleIndex !== -1,
      resultsHash,
      savedResultsHash,
      alreadySaved: resultsHash === savedResultsHash,
      isSaving,
    });

    if (
      results.length > 0 &&
      currentHairstyleIndex !== -1 &&
      resultsHash !== savedResultsHash &&
      !isSaving
    ) {
      // Mark as saving to prevent duplicate saves
      setSavedResultsHash(resultsHash);
      setIsSaving(true);

      // For demo images, we'll pass null as the originalImageId
      const imageId = currentOriginalImageId; // Can be null for demo images

      console.log('💾 Starting to save generated images to database...');
      // Save all images and then refresh the gallery
      const savePromises = results.map(async (imageUrl, index) => {
        console.log(`💾 Saving image ${index + 1}/${results.length}:`, imageUrl);
        const saved = await saveGeneratedImage(imageUrl, imageId, currentHairstyleIndex);
        console.log('✅ Saved result:', saved);
        return saved;
      });

      // Wait for all saves to complete, then refresh gallery
      Promise.all(savePromises)
        .then(() => {
          console.log('🔄 All images saved, triggering gallery refresh...');
          setIsSaving(false);
          triggerRefresh();
        })
        .catch(error => {
          console.error('❌ Error saving images:', error);
          // Reset hash and saving state on error so user can retry
          setSavedResultsHash('');
          setIsSaving(false);
        });
    }
  }, [
    results,
    currentOriginalImageId,
    currentHairstyleIndex,
    savedResultsHash,
    isSaving,
    triggerRefresh,
  ]);

  // Reset saved hash when results change to empty
  React.useEffect(() => {
    if (results.length === 0) {
      setSavedResultsHash('');
      setIsSaving(false);
    }
  }, [results.length]);

  return (
    <div className="flex flex-col gap-6 p-12">
      <div className="flex items-center justify-center gap-4">
        {results.map((result, index) => (
          <div key={`result-${index}`} className="relative">
            <img
              src={result}
              alt="Processed result"
              className="max-h-[500px] w-auto rounded-lg object-contain"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onReset}>
          Try a different hairstyle
        </Button>
      </div>
    </div>
  );
}
