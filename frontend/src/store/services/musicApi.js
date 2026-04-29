import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const musicApi = createApi({
  reducerPath: 'musicApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('accessToken');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Album', 'Song', 'Playlist', 'Review', 'User', 'Admin'],
  endpoints: (builder) => ({
    // Albums
    getAlbums: builder.query({
      query: (params) => ({ url: '/albums', params }),
      providesTags: ['Album'],
    }),
    getAlbum: builder.query({
      query: (id) => `/albums/${id}`,
      providesTags: (result, error, id) => [{ type: 'Album', id }],
    }),
    getTrendingAlbums: builder.query({
      query: () => '/albums/trending',
      providesTags: ['Album'],
    }),
    createAlbum: builder.mutation({
      query: (data) => ({ url: '/albums', method: 'POST', body: data }),
      invalidatesTags: ['Album'],
    }),
    updateAlbum: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/albums/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Album'],
    }),
    deleteAlbum: builder.mutation({
      query: (id) => ({ url: `/albums/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Album'],
    }),

    // Songs
    getSongs: builder.query({
      query: () => '/songs',
      providesTags: ['Song'],
    }),
    getTopSongs: builder.query({
      query: () => '/songs/top',
      providesTags: ['Song'],
    }),
    createSong: builder.mutation({
      query: (data) => ({ url: '/songs', method: 'POST', body: data }),
      invalidatesTags: ['Song', 'Album'],
    }),
    updateSong: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/songs/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Song', 'Album'],
    }),
    deleteSong: builder.mutation({
      query: (id) => ({ url: `/songs/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Song', 'Album'],
    }),
    toggleLikeSong: builder.mutation({
      query: (id) => ({ url: `/songs/${id}/like`, method: 'POST' }),
      invalidatesTags: ['Song', 'User'],
    }),

    // Reviews
    getAlbumReviews: builder.query({
      query: ({ id, ...params }) => ({ url: `/albums/${id}/reviews`, params }),
      providesTags: (result, error, { id }) => [{ type: 'Review', id }],
    }),
    createReview: builder.mutation({
      query: ({ albumId, ...data }) => ({ url: `/albums/${albumId}/reviews`, method: 'POST', body: data }),
      invalidatesTags: (result, error, { albumId }) => [{ type: 'Review', id: albumId }, { type: 'Album', id: albumId }],
    }),
    deleteReview: builder.mutation({
      query: (id) => ({ url: `/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Review', 'Album'],
    }),

    // Playlists
    getPlaylists: builder.query({
      query: () => '/playlists',
      providesTags: ['Playlist'],
    }),
    getPlaylist: builder.query({
      query: (id) => `/playlists/${id}`,
      providesTags: (result, error, id) => [{ type: 'Playlist', id }],
    }),
    createPlaylist: builder.mutation({
      query: (data) => ({ url: '/playlists', method: 'POST', body: data }),
      invalidatesTags: ['Playlist'],
    }),

    // User Profile
    getProfile: builder.query({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),
    getFavorites: builder.query({
      query: () => '/users/favorites',
      providesTags: ['User'],
    }),
    toggleFavorite: builder.mutation({
      query: (albumId) => ({ url: `/users/favorites/${albumId}`, method: 'POST' }),
      invalidatesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({ url: '/users/profile', method: 'PUT', body: data }),
      invalidatesTags: ['User', 'Admin'],
    }),

    // Admin
    getAdminStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['Admin'],
    }),
    getAdminUsers: builder.query({
      query: (params) => ({ url: '/admin/users', params }),
      providesTags: ['Admin'],
    }),
    changeUserRole: builder.mutation({
      query: ({ id, role }) => ({ url: `/admin/users/${id}/role`, method: 'PUT', body: { role } }),
      invalidatesTags: ['Admin'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Admin'],
    }),

    // Creator Management
    getCreatorApplications: builder.query({
      query: (params) => ({ url: '/admin/creator-applications', params }),
      providesTags: ['Admin'],
    }),
    approveCreator: builder.mutation({
      query: (id) => ({ url: `/admin/creator-applications/${id}/approve`, method: 'PATCH' }),
      invalidatesTags: ['Admin', 'User'],
    }),
    rejectCreator: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/creator-applications/${id}/reject`, method: 'PATCH', body: { reason } }),
      invalidatesTags: ['Admin'],
    }),

    // Following
    followArtist: builder.mutation({
      query: (artistId) => ({ url: `/users/follow/${artistId}`, method: 'POST' }),
      invalidatesTags: ['User'],
    }),

    // Creator Dashboard
    getCreatorStats: builder.query({
      query: () => '/creator/stats',
      providesTags: ['User'],
    }),
    getCreatorContent: builder.query({
      query: () => '/creator/content',
      providesTags: ['Album', 'Song'],
    }),
    
    // Unified Search
    unifiedSearch: builder.query({
      query: (q) => `/search?q=${q}`,
      providesTags: ['Album', 'Song', 'User'],
    }),
  }),
});

export const {
  useGetAlbumsQuery, useGetAlbumQuery, useGetTrendingAlbumsQuery,
  useCreateAlbumMutation, useUpdateAlbumMutation, useDeleteAlbumMutation,
  useGetSongsQuery, useGetTopSongsQuery, useCreateSongMutation,
  useGetAlbumReviewsQuery, useCreateReviewMutation, useDeleteReviewMutation,
  useGetPlaylistsQuery, useGetPlaylistQuery, useCreatePlaylistMutation,
  useGetProfileQuery, useGetFavoritesQuery, useToggleFavoriteMutation,
  useGetAdminStatsQuery, useGetAdminUsersQuery, useChangeUserRoleMutation, useDeleteUserMutation,
  useGetCreatorApplicationsQuery, useApproveCreatorMutation, useRejectCreatorMutation,
  useFollowArtistMutation, useGetCreatorStatsQuery, useGetCreatorContentQuery,
  useUpdateProfileMutation,
  useUpdateSongMutation, useDeleteSongMutation,
  useToggleLikeSongMutation,
  useUnifiedSearchQuery,
} = musicApi;
