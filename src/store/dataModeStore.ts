import { create } from 'zustand';

export const DATA_MODES = [
  { id: 'high', label: 'High Quality', description: 'Best video quality, uses more data', icon: '✨' },
  { id: 'data_saver', label: 'Data Saver', description: 'Lower quality video, saves bandwidth', icon: '📶' }
];

interface DataModeState {
  dataMode: string;
  setDataMode: (mode: string) => void;
}

export const useDataModeStore = create<DataModeState>((set) => ({
  dataMode: 'high',
  setDataMode: (mode) => set({ dataMode: mode }),
}));
