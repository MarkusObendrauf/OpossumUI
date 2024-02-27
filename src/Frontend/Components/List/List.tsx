// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { defer } from 'lodash';
import { useEffect, useMemo } from 'react';
import { Virtuoso, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso';

import { useVirtuosoRefs } from '../../util/use-virtuoso-refs';
import { LoadingMask } from '../LoadingMask/LoadingMask';
import { NoResults } from '../NoResults/NoResults';
import { StyledLinearProgress } from './List.style';

export interface ListItemContentProps {
  index: number;
  selected: boolean;
  focused: boolean;
  setFocused: () => void;
}

export interface ListProps {
  className?: string;
  data: ReadonlyArray<string> | null;
  loading?: boolean;
  renderItemContent: (
    datum: string,
    props: ListItemContentProps,
  ) => React.ReactNode;
  selected?: string;
  sx?: SxProps;
  testId?: string;
}

export function List({
  className,
  data,
  loading,
  renderItemContent,
  selected,
  sx,
  testId,
  ...props
}: ListProps & Omit<VirtuosoProps<string, unknown>, 'data' | 'selected'>) {
  const selectedIndex = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return data.findIndex((datum) => datum === selected);
  }, [data, selected]);

  const { focusedIndex, ref, scrollerRef, setFocusedIndex } = useVirtuosoRefs<VirtuosoHandle>({
    data,
    selectedIndex,
  });
  console.log(focusedIndex);

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

  return (
    <LoadingMask
      className={className}
      sx={{ position: 'relative', ...sx }}
      active={loading}
      testId={testId}
    >
      {loading && <StyledLinearProgress />}
      {renderList()}
    </LoadingMask>
  );

  function renderList() {
    if (!data) {
      return null;
    }

    return (
      <Virtuoso
        ref={ref}
        components={{
          EmptyPlaceholder:
            loading || data.length ? undefined : () => <NoResults />,
        }}
        scrollerRef={scrollerRef}
        data={data}
        itemContent={(index) =>
          renderItemContent(data[index], {
            index,
            selected: index === selectedIndex,
            focused: index === focusedIndex,
            setFocused: () => {
              setFocusedIndex(index)
            },
          })
        }
        {...props}
      />
    );
  }
}
