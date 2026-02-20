'use client';

import { create } from 'zustand';

/** Location filter for services only – not saved to user profile. */
const useLocationFilterStore = create((set) => ({
  locationFilter: 'All location',
  setLocationFilter: (value) => set({ locationFilter: value ?? 'All location' }),
  clearLocationFilter: () => set({ locationFilter: 'All location' }),
}));

export default useLocationFilterStore;
