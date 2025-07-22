import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface OptimisticUpdate<TData> {
  queryKey: string[];
  updateFn: (oldData: TData, newData: any) => TData;
  revertFn?: (oldData: TData, failedData: any) => TData;
}

export function useOptimisticUpdates<TData, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<any>,
  optimisticUpdate: OptimisticUpdate<TData>
) {
  const queryClient = useQueryClient();
  const [isOptimistic, setIsOptimistic] = useState(false);

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables) => {
      setIsOptimistic(true);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: optimisticUpdate.queryKey });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(optimisticUpdate.queryKey);
      
      // Optimistically update the cache
      queryClient.setQueryData(
        optimisticUpdate.queryKey,
        (oldData: TData) => optimisticUpdate.updateFn(oldData, variables)
      );
      
      return { previousData };
    },
    onError: (error, variables, context) => {
      setIsOptimistic(false);
      
      // Revert the optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(optimisticUpdate.queryKey, context.previousData);
      }
    },
    onSuccess: (data, variables) => {
      setIsOptimistic(false);
      
      // Update with real server data
      queryClient.invalidateQueries({ queryKey: optimisticUpdate.queryKey });
    },
    onSettled: () => {
      setIsOptimistic(false);
    }
  });

  const mutateOptimistic = useCallback((variables: TVariables) => {
    return mutation.mutate(variables);
  }, [mutation]);

  return {
    mutate: mutateOptimistic,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isOptimistic,
    error: mutation.error,
    reset: mutation.reset,
  };
}