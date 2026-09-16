import type {
  GetMeetingShareDetailResponse,
  GetMeetingShareTranscriptResponse,
  PostMeetingShareEnableResponse
} from '@repo/api-contract/v1/meeting-share'
import {
  type UseMutationOptions,
  type UseQueryOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'

import { meetingsQueryKeys } from '#src/v1/meetings/hooks'
import {
  getMeetingShareDetail,
  getMeetingShareTranscript,
  postMeetingShareEnable
} from '#src/v1/share/index'

const MEETING_SHARE_DETAIL_STALE_MS = 30_000
const MEETING_SHARE_TRANSCRIPT_STALE_MS = 24 * 60 * 60 * 1000
const MEETING_SHARE_PLAYBACK_URL_REFRESH_MS = 50 * 60 * 1000

const shareQueryKeys = {
  all: ['share'] as const,
  detail: (shareSlug: string) =>
    [...shareQueryKeys.all, 'detail', shareSlug] as const,
  transcript: (shareSlug: string) =>
    [...shareQueryKeys.all, 'transcript', shareSlug] as const,
  enable: () => [...shareQueryKeys.all, 'enable'] as const
} as const

type UseMeetingShareDetailOptions = Omit<
  UseQueryOptions<GetMeetingShareDetailResponse>,
  'queryKey' | 'queryFn'
>

function _shareDetailRefetchInterval(query: {
  state: { data: GetMeetingShareDetailResponse | undefined }
}) {
  const data = query.state.data
  if (data?.success === true && data.data.recordingPlayback) {
    return MEETING_SHARE_PLAYBACK_URL_REFRESH_MS
  }
  return MEETING_SHARE_DETAIL_STALE_MS
}

function meetingShareDetailQueryOptions(
  shareSlug: string,
  options?: UseMeetingShareDetailOptions
) {
  return queryOptions({
    queryKey: shareQueryKeys.detail(shareSlug),
    queryFn: () => getMeetingShareDetail(shareSlug),
    staleTime: MEETING_SHARE_DETAIL_STALE_MS,
    gcTime: MEETING_SHARE_TRANSCRIPT_STALE_MS,
    refetchInterval: _shareDetailRefetchInterval,
    ...options
  })
}

function useMeetingShareDetailQuery(
  shareSlug: string,
  options?: UseMeetingShareDetailOptions
) {
  return useQuery(meetingShareDetailQueryOptions(shareSlug, options))
}

type UseMeetingShareTranscriptOptions = Omit<
  UseQueryOptions<GetMeetingShareTranscriptResponse>,
  'queryKey' | 'queryFn'
>

function meetingShareTranscriptQueryOptions(
  shareSlug: string,
  options?: UseMeetingShareTranscriptOptions
) {
  return queryOptions({
    queryKey: shareQueryKeys.transcript(shareSlug),
    queryFn: () => getMeetingShareTranscript(shareSlug),
    staleTime: MEETING_SHARE_TRANSCRIPT_STALE_MS,
    gcTime: MEETING_SHARE_TRANSCRIPT_STALE_MS,
    ...options
  })
}

function useMeetingShareTranscriptQuery(
  shareSlug: string,
  options?: UseMeetingShareTranscriptOptions
) {
  return useQuery(meetingShareTranscriptQueryOptions(shareSlug, options))
}

type UsePostMeetingShareEnableMutationOptions = Omit<
  UseMutationOptions<PostMeetingShareEnableResponse, Error, string>,
  'mutationFn'
>

function usePostMeetingShareEnableMutation(
  options?: UsePostMeetingShareEnableMutationOptions
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: shareQueryKeys.enable(),
    mutationFn: (meetingId: string) => postMeetingShareEnable(meetingId),
    ...options,
    onSuccess: async (data, meetingId, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: meetingsQueryKeys.detail(meetingId)
      })
      await options?.onSuccess?.(data, meetingId, onMutateResult, context)
    }
  })
}

export {
  meetingShareDetailQueryOptions,
  meetingShareTranscriptQueryOptions,
  shareQueryKeys,
  useMeetingShareDetailQuery,
  useMeetingShareTranscriptQuery,
  usePostMeetingShareEnableMutation
}
