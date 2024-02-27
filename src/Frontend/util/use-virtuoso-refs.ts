// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useRef, useState } from 'react';
import { VirtuosoHandle } from 'react-virtuoso';

export function useVirtuosoRefs<T extends VirtuosoHandle>({
  data,
  selectedIndex,
}: {
  data: ReadonlyArray<string> | null | undefined;
  selectedIndex: number | undefined;
}) {
  const ref = useRef<T>(null);
  const listRef = useRef<Window | HTMLElement>();
  const [focusedIndex, setFocusedIndex] = useState(selectedIndex ?? -1);

  const keyDownCallback = useCallback(
    (event: Event) => {
      if (data?.length !== undefined && event instanceof KeyboardEvent) {
        let nextIndex: number | null = null;

        if (event.code === 'ArrowUp') {
          nextIndex = Math.max(0, focusedIndex - 1);
        } else if (event.code === 'ArrowDown') {
          nextIndex = Math.min(data.length - 1, focusedIndex + 1);
        }

        if (nextIndex !== null) {
          const index = nextIndex;
          ref.current?.scrollIntoView({
            index,
            behavior: 'auto',
            done: () => setFocusedIndex(index),
          });
          event.preventDefault();
        }
      }
    },
    [data?.length, focusedIndex],
  );

  const scrollerRef = useCallback(
    (ref: Window | HTMLElement | null) => {
      if (ref) {
        ref.addEventListener('keydown', keyDownCallback);
        listRef.current = ref;
      } else {
        listRef.current?.removeEventListener('keydown', keyDownCallback);
      }
    },
    [keyDownCallback],
  );

  return {
    ref,
    scrollerRef,
    focusedIndex,
    setFocusedIndex
  };
}
