import { useCallback, useRef, useState } from "react";

// Runs an async action at most once at a time. The ref flips immediately
// (unlike React state, which updates after the render), so a fast double
// click, or Enter plus a click, can never start the action twice.
// `pending` drives the loading UI.
export default function useSingleFlight() {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);

  const run = useCallback(async (action) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      return await action();
    } finally {
      busy.current = false;
      setPending(false);
    }
  }, []);

  return [run, pending];
}
