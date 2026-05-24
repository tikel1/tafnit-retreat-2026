import { createContext, useContext } from "react";

export interface MapFocusContextValue {
  focusOn: (id: string) => void;
}

export const MapFocusContext = createContext<MapFocusContextValue>({
  focusOn: () => {}
});

export function useMapFocus() {
  return useContext(MapFocusContext);
}
