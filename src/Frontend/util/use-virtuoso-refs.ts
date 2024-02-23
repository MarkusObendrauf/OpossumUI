// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { defer } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VirtuosoHandle } from 'react-virtuoso';

export function useVirtuosoRefs<T extends VirtuosoHandle>({
  data,
  selected,
}: {
  data: ReadonlyArray<string> | null | undefined;
  selected: string | undefined;
}) {
  const ref = useRef<T>(null);
  const listRef = useRef<Window | HTMLElement>();
  const [isFocused, setIsFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>();

  const selectedIndex = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return data.findIndex((datum) => datum === selected);
  }, [data, selected]);

  useEffect(() => {
    if (isFocused) {
      setFocusedIndex(selectedIndex);
    }

    return () => {
      setFocusedIndex(undefined);
    };
  }, [isFocused, selectedIndex]);

  useEffect(() => {
    if (selectedIndex !== undefined && selectedIndex >= 0) {
      defer(() =>
        ref.current?.scrollIntoView({
          index: selectedIndex,
          align: 'center',
        }),
      );
    }
  }, [selectedIndex, ref]);

  const handleKeyDown = useCallback(
    (event: Event) => {
      if (
        data?.length !== undefined &&
        focusedIndex !== undefined &&
        event instanceof KeyboardEvent
      ) {
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
          });
          setFocusedIndex(index);
          event.preventDefault();
        }
      }
    },
    [data?.length, focusedIndex],
  );

  const scrollerRef = useCallback(
    (ref: Window | HTMLElement | null) => {
      if (ref) {
        ref.addEventListener('keydown', handleKeyDown);
        listRef.current = ref;
      } else {
        listRef.current?.removeEventListener('keydown', handleKeyDown);
      }
    },
    [handleKeyDown],
  );

  return {
    focusedIndex,
    isFocused,
    ref,
    scrollerRef,
    selectedIndex,
    setIsFocused,
  };
}
