import { useEffect } from 'react';
import { entityChangedEventSchema } from '@/shared/contracts/messages';

export function useEntityChanges(onChange: () => void) {
  useEffect(() => {
    const listener = (message: unknown) => {
      if (entityChangedEventSchema.safeParse(message).success) onChange();
    };
    chrome.runtime?.onMessage?.addListener(listener);
    return () => chrome.runtime?.onMessage?.removeListener(listener);
  }, [onChange]);
}
