import { agentService } from '../services/agent.service';
import { processFileStream } from './process-file-stream';
import { ChatFileMetadata, ProcessFilesCallback } from '../types/chat-store.types';

const projectSlug = import.meta.env.VITE_PROJECT_SLUG || '';

export const UNSTRUCTURED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.html', '.md', '.doc'];

export const isUnstructuredFile = (extension: string): boolean => {
  return UNSTRUCTURED_EXTENSIONS.includes(extension);
};

export const filterUnstructuredFiles = (files: ChatFileMetadata[]): ChatFileMetadata[] => {
  return files.filter((f) => isUnstructuredFile(f.extension));
};

export const processUnstructuredFiles = async (
  sessionId: string,
  files: ChatFileMetadata[],
  processFilesCallback?: ProcessFilesCallback
): Promise<{ success: boolean; message?: string }> => {
  const unstructuredFiles = filterUnstructuredFiles(files);

  if (unstructuredFiles.length === 0) {
    return { success: true };
  }

  const fileIds = unstructuredFiles.map((f) => f.fileId);

  if (processFilesCallback) {
    return await processFilesCallback({
      session_id: sessionId,
      call_from: projectSlug,
      file_ids: fileIds,
    });
  } else {
    return await processFileStream(
      await agentService.processFiles({
        session_id: sessionId,
        call_from: projectSlug,
        file_ids: fileIds,
      })
    );
  }
};

export const enhanceQueryWithFileContext = (message: string, files: ChatFileMetadata[]): string => {
  if (files.length === 1) {
    const fileName = files[0].fileName;
    return `${message}\n\n[Note: User has attached a file: ${fileName}]`;
  } else if (files.length > 1) {
    const fileList = files.map((f) => f.fileName).join(', ');
    return `${message}\n\n[Note: User has attached ${files.length} files: ${fileList}]`;
  }
  return message;
};
