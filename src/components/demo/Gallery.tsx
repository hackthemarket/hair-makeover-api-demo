'use client';

import { useGeneratedImages } from '@/hooks/useGeneratedImages';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

export function Gallery() {
  const { images, isLoading, deleteImage, refetch } = useGeneratedImages();

  console.log('🖼️ Gallery rendered with images:', images.length);

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading gallery...</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-muted-foreground mb-2">No generated images yet</div>
        <div className="text-muted-foreground text-sm">
          Create your first hair makeover to see it here!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-lg font-medium">Gallery</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('🔄 Refreshing gallery...');
            refetch();
          }}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map(image => (
          <div key={image.id} className="group relative">
            <div className="bg-muted aspect-square overflow-hidden rounded-lg">
              <img
                src={image.result_url}
                alt={`Generated makeover from ${image.original_filename}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>

            {/* Overlay with actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDownload(image.result_url, `makeover-${image.id}.jpg`)}
                className="h-8 w-8 p-0"
              >
                <Download size={14} />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteImage(image.id)}
                className="h-8 w-8 p-0"
              >
                <Trash2 size={14} />
              </Button>
            </div>

            {/* Info overlay */}
            <div className="absolute right-0 bottom-0 left-0 rounded-b-lg bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="text-xs text-white">
                <div className="truncate font-medium">{image.original_filename}</div>
                <div className="text-white/70">
                  {new Date(image.created_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
