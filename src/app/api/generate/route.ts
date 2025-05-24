import { OUTPUT_RATIO } from '@/constants';
import { imageApiRequest } from '@/lib/runway-api';
import { withApiAuth } from '@/middleware/api-auth';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_PROMPT = 'IMG_1 with IMG_2 hair style';

async function generateHandler(req: NextRequest, _: unknown, apiKey: string) {
  console.log('🚀 Generate API route called');

  try {
    console.log('📥 Parsing request body...');
    const { userImage, hairstyleImage, prompt } = await req.json();

    console.log('📝 Request data received:', {
      hasUserImage: !!userImage,
      userImageLength: userImage?.length || 0,
      hasHairstyleImage: !!hairstyleImage,
      hairstyleImageLength: hairstyleImage?.length || 0,
      prompt: prompt || 'no prompt',
      hasApiKey: !!apiKey,
    });

    const promptText = prompt || DEFAULT_PROMPT;

    if (!promptText || !userImage || !hairstyleImage) {
      console.error('❌ Missing required fields:', {
        hasPrompt: !!promptText,
        hasUserImage: !!userImage,
        hasHairstyleImage: !!hairstyleImage,
      });
      return NextResponse.json(
        { error: 'Missing required fields: prompt, userImage, or hairstyleImage' },
        { status: 400 }
      );
    }

    console.log('🎯 Calling Runway API with:', {
      endpoint: '/v1/text_to_image',
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey?.substring(0, 8) + '...',
      promptText,
      ratio: OUTPUT_RATIO,
      model: 'gen4_image',
      referenceImagesCount: 2,
    });

    const requestBody = {
      promptText,
      ratio: OUTPUT_RATIO,
      model: 'gen4_image',
      referenceImages: [
        {
          uri: userImage,
        },
        {
          uri: hairstyleImage,
        },
      ],
    };

    console.log('📦 Request body prepared, size:', JSON.stringify(requestBody).length);

    const data = await imageApiRequest('/v1/text_to_image', apiKey, {
      method: 'POST',
      body: requestBody,
    });

    console.log('✅ Runway API responded successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error in generate API route:', error);

    // Try to parse the error if it's a JSON string
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      try {
        const parsedError = JSON.parse(error.message);
        console.error('📄 Parsed error details:', parsedError);
        errorMessage = parsedError.details?.error || parsedError.statusText || error.message;
      } catch {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export const POST = withApiAuth(generateHandler);
