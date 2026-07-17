/**
 * Unified client-side file upload helper.
 * Validates file size and type before sending to `/api/upload`.
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3']; // audio/mpeg corresponds to MP3

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20 MB

export async function uploadFile(file: File, bucket: string, field?: string): Promise<string> {
  // 1. Validation before upload
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type) || file.name.endsWith('.mp3');

  if (!isImage && !isAudio) {
    throw new Error('Unsupported file type. Allowed types: JPEG, PNG, WEBP, GIF, MP3.');
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new Error('File too large. Maximum size for images is 10 MB.');
  }

  if (isAudio && file.size > MAX_AUDIO_SIZE) {
    throw new Error('File too large. Maximum size for music is 20 MB.');
  }

  // Helper function to perform fetch with a single retry
  const sendRequest = async (): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    if (field) {
      formData.append('field', field);
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Upload failed with status ${res.status}`);
    }

    if (!data.url) {
      throw new Error('Upload response did not contain a public URL.');
    }

    return data.url;
  };

  try {
    // Attempt 1
    return await sendRequest();
  } catch (error) {
    console.warn('First upload attempt failed, retrying once...', error);
    // Automatic retry once
    try {
      return await sendRequest();
    } catch (retryError) {
      const msg = retryError instanceof Error ? retryError.message : 'Unknown retry failure';
      throw new Error(`Upload failed after retry: ${msg}`);
    }
  }
}
