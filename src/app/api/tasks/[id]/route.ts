import { imageApiRequest } from '@/lib/runway-api';
import { withApiAuth } from '@/middleware/api-auth';
import { NextRequest, NextResponse } from 'next/server';

async function getTaskHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  apiKey: string
) {
  try {
    const { id: taskId } = await params;
    console.log('🔍 Task status API called for task:', taskId);

    if (!taskId) {
      console.error('❌ Task ID is missing');
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    console.log('📡 Fetching task status from Runway API...');
    const data = await imageApiRequest(`/v1/tasks/${taskId}`, apiKey);
    console.log('✅ Task status received:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error fetching task status:', error);

    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      try {
        const parsedError = JSON.parse(error.message);
        console.error('📄 Parsed task status error:', parsedError);
        errorMessage = parsedError.details?.error || parsedError.statusText || error.message;
      } catch {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function cancelTaskHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  apiKey: string
) {
  try {
    const { id: taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const data = await imageApiRequest(`/v1/tasks/${taskId}`, apiKey, {
      method: 'DELETE',
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error canceling task:', error);

    let errorResponse = { error: 'Internal server error' };
    let status = 500;

    if (error instanceof Error && error.message) {
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.status && parsedError.details) {
          errorResponse = parsedError.details;
          status = parsedError.status;

          if (request.method === 'DELETE' && status === 404) {
            return NextResponse.json(
              { message: 'Task not found or already processed.', originalError: errorResponse },
              { status: 404 }
            );
          }
        }
      } catch {
        errorResponse = { error: error.message || 'Internal server error' };
      }
    }
    return NextResponse.json(errorResponse, { status });
  }
}

type NextRouteHandler = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => Promise<NextResponse>;

export const GET: NextRouteHandler = withApiAuth(getTaskHandler);
export const DELETE: NextRouteHandler = withApiAuth(cancelTaskHandler);
