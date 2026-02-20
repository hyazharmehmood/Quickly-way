'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'quicklyway-favorites';

/**
 * Favorites are stored in localStorage.
 * Each item: { id, title, price, currency, image }
 */
const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (service) => {
        const id = service?.id;
        const title = service?.title || service?.name || 'Service';
        const price = service?.price != null ? service.price : null;
        const currency = service?.currency || '';
        const image = service?.thumbnailUrl || service?.coverImage || service?.image || (service?.galleryUrls?.[0]) || null;
        if (!id) return;
        set((state) => {
          if (state.favorites.some((f) => f.id === id)) return state;
          return { favorites: [...state.favorites, { id, title, price, currency, image }] };
        });
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        }));
      },

      clearAllFavorites: () => set({ favorites: [] }),

      toggleFavorite: (service) => {
        const id = service?.id;
        if (!id) return;
        const isFav = get().favorites.some((f) => f.id === id);
        if (isFav) get().removeFavorite(id);
        else get().addFavorite(service);
      },

      isFavorite: (id) => get().favorites.some((f) => f.id === id),
    }),
    { name: STORAGE_KEY }
  )
);

export default useFavoritesStore;
