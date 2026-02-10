import React, { createContext, useContext, useState, useCallback } from "react";

const FocusContext = createContext(null);

export function FocusProvider({ children }) {
  const [focus, setFocus] = useState(null);

  const requestFocus = useCallback((storeNumber) => {
    if (!storeNumber) return;
    const sn = String(storeNumber);
    try {
      localStorage.setItem("focusStoreNumber", sn);
    } catch (e) {}

    // Emit an in-window event so components can listen immediately
    try {
      window.dispatchEvent(new CustomEvent("kwik:focusStore", { detail: sn }));
    } catch (e) {}

    // update local provider state for consumers that read it
    setFocus({ storeNumber: sn, requestedAt: Date.now() });
  }, []);

  return (
    <FocusContext.Provider value={{ focus, requestFocus }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    return { focus: null, requestFocus: () => {} };
  }
  return ctx;
}

export default FocusContext;
