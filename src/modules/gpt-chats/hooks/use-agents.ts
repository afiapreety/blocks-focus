import { useQuery, useMutation } from '@tanstack/react-query';
import { IGetAgentsPayload, IProcessFilesPayload } from '../types/agent.service.type';
import { agentService } from '../services/agent.service';
import { processFileStream } from '../utils/process-file-stream';

export const useGetAgents = (options: IGetAgentsPayload) => {
  return useQuery({
    queryKey: ['agents', options],
    queryFn: () => agentService.getAgents(options),
  });
};

export const useProcessFiles = () => {
  return useMutation({
    mutationKey: ['agent', 'process-files'],
    mutationFn: async (payload: IProcessFilesPayload) => {
      const reader = await agentService.processFiles(payload);
      return processFileStream(reader);
    },
  });
};
