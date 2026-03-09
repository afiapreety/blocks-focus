import { Button } from '@/components/ui-kit/button';
import { Textarea } from '@/components/ui-kit/textarea';
import { ArrowUp, FileText, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { GroupedModelSelector } from './model-selector';
import { ToolsSelector } from './tools-selector';
import { UploadFile } from './upload-file';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui-kit/tooltip';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useGetPreSignedUrlForUpload } from '@/lib/api/hooks/use-storage';
import { ChatFileMetadata, SelectModelType } from '../../types/chat-store.types';
import { formatFileSize } from '../../utils/format-file-size';

interface GptChatInputProps {
  onSendMessage: (message: string, files?: ChatFileMetadata[]) => void;
  disabled?: boolean;
  placeholder?: string;
  selectedModel: SelectModelType;
  onModelChange: (model: SelectModelType) => void;
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
  className?: string;
  variant?: 'default' | 'chat-details';
}

type UploadedFile = {
  file: File;
  uploadUrl?: string;
  fileId?: string;
};

const projectKey = import.meta.env.VITE_X_BLOCKS_KEY || '';

export const GptChatInput = ({
  onSendMessage,
  disabled = false,
  placeholder,
  selectedModel,
  onModelChange,
  selectedTools,
  onToolsChange,
  className,
  variant = 'default',
}: GptChatInputProps) => {
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const { t } = useTranslation();
  const { toast } = useToast();
  const uploadMutation = useGetPreSignedUrlForUpload();
  const isAgentChat = selectedModel?.provider === 'agents';

  const uploadFileToStorage = async (url: string, file: File) => {
    await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
        'x-ms-blob-type': 'BlockBlob',
      },
    });
    return { uploadUrl: url.split('?')[0] };
  };

  const uploadSingleFile = async (file: File, index: number) => {
    const fileName = file.name;
    setUploadingFiles((prev) => new Set(prev).add(fileName));

    try {
      const data = await uploadMutation.mutateAsync({
        name: file.name,
        projectKey: projectKey,
        itemId: '',
        metaData: '',
        accessModifier: 'Public',
        configurationName: 'Default',
        parentDirectoryId: '',
        tags: '',
      });

      if (!data.isSuccess || !data.uploadUrl) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl } = await uploadFileToStorage(data.uploadUrl, file);

      setUploadedFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, uploadUrl, fileId: data.fileId } : f))
      );
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: `Error uploading ${file.name}`,
        variant: 'destructive',
      });
    } finally {
      setUploadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileName);
        return next;
      });
    }
  };

  const handleUploadFiles = async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({ file }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);

    const startIndex = uploadedFiles.length;
    files.forEach((file, index) => {
      uploadSingleFile(file, startIndex + index);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const hasUploadingFiles = uploadingFiles.size > 0;
  const hasFailedFiles = uploadedFiles.some((f) => !f.fileId && !uploadingFiles.has(f.file.name));

  const onMessageHandler = () => {
    if (hasUploadingFiles) {
      toast({
        title: 'Files Uploading',
        description: 'Please wait for files to finish uploading',
        variant: 'destructive',
      });
      return;
    }

    if (hasFailedFiles) {
      toast({
        title: 'Upload Failed',
        description: 'Please remove failed files before sending',
        variant: 'destructive',
      });
      return;
    }

    const files = uploadedFiles
      .filter((f) => f.fileId && f.uploadUrl)
      .map((f) => {
        const fileName = f.file.name;
        const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        return {
          fileId: f.fileId as string,
          fileName: fileName,
          fileUrl: f.uploadUrl as string,
          extension: extension,
          fileSize: f.file.size,
        };
      });

    onSendMessage(message, files.length > 0 ? files : undefined);
    setMessage('');
    setUploadedFiles([]);
  };

  return (
    <div
      className={cn(
        'sticky bottom-0 w-full z-10',
        variant === 'chat-details' ? 'bg-background/95 backdrop-blur-sm' : '',
        className
      )}
    >
      <div
        className={`w-full px-2 md:px-6 lg:px-8 pb-4 pt-2 ${variant !== 'chat-details' && 'max-w-4xl mx-auto'}`}
      >
        <div className="bg-card relative rounded-3xl border-2 border-border hover:border-primary focus-within:border-primary">
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-6 pt-4 pb-2">
              {uploadedFiles.map((uploadedFile, index) => {
                const isUploading = uploadingFiles.has(uploadedFile.file.name);
                const hasError = !uploadedFile.fileId && !isUploading;
                const fileSizeDisplay = formatFileSize(uploadedFile.file.size);

                return (
                  <div
                    key={index}
                    className={cn(
                      'group relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm transition-all',
                      hasError
                        ? 'bg-destructive/10 border border-destructive'
                        : 'bg-muted/90 hover:bg-muted'
                    )}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 text-muted-foreground flex-shrink-0 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span
                      className="truncate max-w-[200px] font-medium"
                      title={uploadedFile.file.name}
                    >
                      {uploadedFile.file.name}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {fileSizeDisplay}
                    </span>
                    {hasError && (
                      <span className="text-xs text-destructive font-medium">Failed</span>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full p-1 hover:bg-destructive hover:border-destructive hover:text-destructive-foreground shadow-sm"
                      disabled={isUploading}
                      aria-label="Remove file"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onMessageHandler();
              }
            }}
            placeholder={placeholder || t('ASK_ME_ANYTHING')}
            disabled={disabled}
            className={cn(
              'min-h-[80px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-16 px-6 pb-12 sm:pb-5 text-base placeholder:text-muted-foreground/60',
              uploadedFiles.length > 0 ? 'pt-2' : 'py-5'
            )}
          />

          <div className="absolute  right-4 bottom-[75px] sm:right-4">
            <Button
              size="icon"
              className={`h-10 w-10 rounded-2xl ${
                message.trim() && !disabled && !hasUploadingFiles && !hasFailedFiles
                  ? 'bg-primary hover:bg-primary/90 text-white  hover:scale-110'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              onClick={onMessageHandler}
              disabled={!message.trim() || disabled || hasUploadingFiles || hasFailedFiles}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 pb-3 pt-2 border-t border-border/50 gap-2 sm:gap-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <GroupedModelSelector
                      value={selectedModel}
                      onChange={onModelChange}
                      locked={isAgentChat}
                      isAgentChat={isAgentChat}
                    />
                  </div>
                </TooltipTrigger>
              </Tooltip>

              {!isAgentChat && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <UploadFile onUploadFiles={handleUploadFiles} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Attach File</TooltipContent>
                </Tooltip>
              )}
              {!isAgentChat && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ToolsSelector value={selectedTools} onChange={onToolsChange} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Select Tools</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground/70 mt-3">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd> to send,{' '}
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};
