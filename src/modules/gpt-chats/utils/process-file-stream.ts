export interface ProcessFilesResult {
  success: boolean;
  message?: string;
  data?: string;
}

const parseErrorFromLine = (line: string): string | null => {
  if (!line.startsWith('data: ') || !line.includes('file_error')) {
    return null;
  }

  try {
    const data = JSON.parse(line.slice(6));
    return data.message ? `${data.file_name}: ${data.message}` : null;
  } catch {
    return null;
  }
};

const processStreamChunk = (chunk: string, errors: string[]): number => {
  let errorCount = 0;
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('event: file_error')) {
      errorCount++;
    } else {
      const errorMessage = parseErrorFromLine(line);
      if (errorMessage) {
        errors.push(errorMessage);
      }
    }
  }

  return errorCount;
};

export const processFileStream = async (
  reader: ReadableStreamDefaultReader<Uint8Array>
): Promise<ProcessFilesResult> => {
  const decoder = new TextDecoder();
  const errors: string[] = [];
  let responseData = '';
  let totalErrorCount = 0;
  let isDone = false;

  while (!isDone) {
    const { done, value } = await reader.read();
    isDone = done;

    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      responseData += chunk;
      totalErrorCount += processStreamChunk(chunk, errors);
    }
  }

  const hasErrors = totalErrorCount > 0 || errors.length > 0;

  if (hasErrors) {
    return {
      success: false,
      message: errors.join('; ') || 'File processing failed',
      data: responseData,
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { success: true, message: 'Files processed successfully', data: responseData };
};
