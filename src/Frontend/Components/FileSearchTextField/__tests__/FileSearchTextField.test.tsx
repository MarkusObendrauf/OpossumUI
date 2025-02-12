// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { renderComponent } from '../../../test-helpers/render';
import { FileSearchTextField } from '../FileSearchTextField';

describe('The FileSearchTextField', () => {
  jest.useFakeTimers();
  const debounceDelayInMs = 200;

  it('renders', () => {
    const setFilteredPaths = jest.fn();
    renderComponent(
      <FileSearchTextField setFilteredPaths={setFilteredPaths} />,
    );
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });

  it('calls callback after debounce time', () => {
    const setFilteredPaths = jest.fn();
    renderComponent(
      <FileSearchTextField setFilteredPaths={setFilteredPaths} />,
    );

    screen.getByLabelText('Search');

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'test' },
    });

    expect(setFilteredPaths).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(debounceDelayInMs);
    });

    expect(setFilteredPaths).toHaveBeenCalled();
  });
});
