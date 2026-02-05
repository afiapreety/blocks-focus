import { useQuery } from '@tanstack/react-query';
import { IGetAgentsPayload } from '../types/agent.service.type';
import { agentService } from '../services/agent.service';

export const useGetAgents = (options: IGetAgentsPayload) => {
  return useQuery({
    queryKey: ['agents', options],
    queryFn: () => agentService.getAgents(options),
  });
};
