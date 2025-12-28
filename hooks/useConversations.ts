import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface UpdateRatingParams {
  id: string
  rating: number
  notes?: string
}

const fetchConversations = async (filters?: any) => {
  // Mock implementation - replace with actual API call
  return { data: [], pagination: { totalPages: 1, totalItems: 0 } }
}

const fetchConversation = async (id: string) => {
  // Mock implementation - replace with actual API call
  return { id, messages: [] }
}

const updateConversationRating = async (id: string, data: { rating: number, notes?: string }) => {
  // Mock implementation - replace with actual API call
  return { id, ...data }
}

export function useConversations(filters?: any) {
  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: () => fetchConversations(filters),
  })
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => fetchConversation(id),
    enabled: !!id,
  })
}

export function useUpdateRating() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, rating, notes }: UpdateRatingParams) => 
      updateConversationRating(id, { rating, notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.id] })
    },
  })
}