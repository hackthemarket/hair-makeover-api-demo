'use client';

import { useEffect, useRef, useState } from 'react';

type Task = {
  id: string;
};

export enum Status {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export function useTextToImage() {
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentOriginalImageId, setCurrentOriginalImageId] = useState<string | null>(null);
  const [currentHairstyleIndex, setCurrentHairstyleIndex] = useState<number>(-1);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update isLoading whenever status changes
  useEffect(() => {
    setIsLoading(status === Status.PENDING || status === Status.RUNNING);
  }, [status]);

  const generateImage = async (
    userImage: File,
    hairstyleImageUrl: string,
    prompt: string,
    hairstyleIndex: number,
    originalImageId?: string
  ) => {
    console.log('🎨 Starting image generation process:', {
      userImageName: userImage.name,
      userImageSize: userImage.size,
      hairstyleImageUrl,
      prompt,
      hairstyleIndex,
      originalImageId,
    });

    setStatus(Status.PENDING);
    setError(null); // Clear any previous errors

    try {
      // Create a new abort controller at the beginning
      const controller = new AbortController();
      abortControllerRef.current = controller;

      console.log('📷 Converting user image to base64...');
      // Convert userImage to base64
      const userImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(userImage);
        reader.onload = () => {
          console.log(
            '✅ User image converted to base64, length:',
            (reader.result as string).length
          );
          resolve(reader.result as string);
        };
        reader.onerror = error => {
          console.error('❌ Error converting user image to base64:', error);
          reject(error);
        };
      });

      console.log('🎭 Fetching hairstyle image from:', hairstyleImageUrl);
      // Fetch hairstyle image and convert to base64
      const hairstyleImageResponse = await fetch(hairstyleImageUrl);
      if (!hairstyleImageResponse.ok) {
        console.error(
          '❌ Failed to fetch hairstyle image:',
          hairstyleImageResponse.status,
          hairstyleImageResponse.statusText
        );
        throw new Error(`Failed to fetch hairstyle image: ${hairstyleImageResponse.status}`);
      }
      console.log('✅ Hairstyle image fetched successfully');

      const hairstyleImageBlob = await hairstyleImageResponse.blob();
      console.log('📷 Converting hairstyle image to base64, blob size:', hairstyleImageBlob.size);

      const hairstyleImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(hairstyleImageBlob);
        reader.onload = () => {
          console.log(
            '✅ Hairstyle image converted to base64, length:',
            (reader.result as string).length
          );
          resolve(reader.result as string);
        };
        reader.onerror = error => {
          console.error('❌ Error converting hairstyle image to base64:', error);
          reject(error);
        };
      });

      const payload = {
        userImage: userImageBase64,
        hairstyleImage: hairstyleImageBase64,
        prompt: prompt,
        originalImageId,
        hairstyleIndex,
      };

      console.log(
        '🚀 Sending request to /api/generate with payload size:',
        JSON.stringify(payload).length
      );

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal, // Use the abort signal for the initial request
      });

      console.log('📡 Generate API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Generate API error response:', errorText);
        setStatus(Status.FAILED);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const task = (await response.json()) as Task;
      console.log('✅ Task created successfully:', task);
      setCurrentTaskId(task.id);
      setCurrentHairstyleIndex(hairstyleIndex);
      setCurrentOriginalImageId(originalImageId || null);

      console.log('⏳ Starting polling for task completion...');
      // Now use the same controller for polling
      const results = await pollForCompletion(task.id, setStatus, setError, controller.signal);

      console.log('🎉 Image generation completed with results:', results);
      setResults(results);
      return results;
    } catch (error) {
      // Check if the error was due to an abort
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('⚠️ Request was aborted');
        setStatus(Status.IDLE);
      } else {
        console.error('💥 Error in generateImage:', error);
        setStatus(Status.FAILED);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
      return [];
    }
  };

  const cancelTaskCreation = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const cancelTask = async () => {
    if (!currentTaskId) {
      // if no task id, we can abort the task creation
      cancelTaskCreation();
      return;
    }

    try {
      // Abort the polling process
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      const response = await fetch(`/api/tasks/${currentTaskId}`, {
        method: 'DELETE',
      });

      // Handle both successful cancellation and "already cancelled/not found" cases
      if (response.ok || response.status === 404) {
        const data = await response.json();

        // If we got a specific status back, log it
        if (data && data.status) {
          console.log(`Task cancellation status: ${data.status}`);
        }

        // Reset all state
        setStatus(Status.IDLE);
        setCurrentTaskId(null);
        setResults([]);
        return true;
      }

      const errorData = await response.json();
      console.error('Error canceling task:', errorData);
      return false;
    } catch (error) {
      console.error('Error canceling task:', error);
      return false;
    }
  };

  const resetResults = () => {
    // Reset all state
    setResults([]);
    setError(null);
    setStatus(Status.IDLE);
    setCurrentTaskId(null);
    setCurrentOriginalImageId(null);
    setCurrentHairstyleIndex(-1);

    // Abort any ongoing polling
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return {
    status,
    isLoading,
    results,
    error,
    generateImage,
    cancelTask,
    resetResults,
    currentTaskId,
    currentOriginalImageId,
    currentHairstyleIndex,
  };
}

async function pollForCompletion(
  taskId: string,
  setStatus: (status: Status) => void,
  setError: (error: string | null) => void,
  signal?: AbortSignal
) {
  console.log('🔄 Starting polling for task:', taskId);
  // Set status to RUNNING immediately when polling starts
  setStatus(Status.RUNNING);

  let pollCount = 0;

  while (true) {
    pollCount++;
    console.log(`🔄 Poll attempt #${pollCount} for task ${taskId}`);

    // Check if polling has been aborted
    if (signal?.aborted) {
      console.log('⚠️ Polling aborted');
      return [];
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      console.log('📡 Task status API response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Task status API error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📄 Task status data:', data);

      if (data.status === 'SUCCEEDED') {
        console.log('✅ Task completed successfully!');
        setStatus(Status.SUCCEEDED);
        return data.output;
      } else if (data.status === 'FAILED') {
        console.error('❌ Task failed:', data);
        setStatus(Status.FAILED);

        // Handle specific failure messages
        let errorMessage = 'Task failed';
        if (data.failure) {
          errorMessage = data.failure;

          // Provide user-friendly messages for specific failure codes
          if (data.failureCode === 'SAFETY.OUTPUT.IMAGE') {
            errorMessage =
              "Image generation failed due to content policy restrictions. Please try with a different image that doesn't contain public figures or inappropriate content.";
          }
        } else if (data.error) {
          errorMessage = data.error;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      } else {
        // Task is still processing, wait before checking again
        console.log(`⏳ Task still ${data.status}, waiting 2.5s before next poll...`);
        setStatus(Status.RUNNING);

        // Use a delay that can be interrupted by an abort signal
        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 2500);

            if (signal) {
              signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('Polling aborted'));
              });
            }
          });
        } catch {
          // If the promise was rejected due to an abort, break the polling loop
          console.log('⚠️ Polling delay aborted');
          return [];
        }
      }
    } catch (error) {
      console.error('💥 Error polling for task completion:', error);
      setStatus(Status.FAILED);
      throw error;
    }
  }
}
