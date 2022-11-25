// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { act, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import {
  Attributions,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { TopProgressBar } from '../TopProgressBar';
import { DiscreteConfidence } from '../../../enums/enums';
import {
  setResources,
  setManualData,
  setExternalData,
  setAttributionBreakpoints,
  setFilesWithChildren,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setResolvedExternalAttributions } from '../../../state/actions/resource-actions/audit-view-simple-actions';

describe('TopProgressBar', () => {
  jest.useFakeTimers();
  it('TopProgressBar renders', () => {
    const testResources: Resources = {
      folder1: { file1: 1, file2: 1 },
      folder2: { file1: 1, file2: 1 },
      file1: 1,
      file2: 1,
    };

    const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
    const testManualAttributionUuid_2 = 'b5da73d4-f400-11ea-adc1-0242ac120002';
    const testExternalAttributionUuid = 'b5da73d4-f400-11ea-adc1-0242ac120003';
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
    };
    const secondTestTemporaryPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'not assigned test Package',
      licenseText: ' test not assigned License text',
      preSelected: true,
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid_1]: testTemporaryPackageInfo,
      [testManualAttributionUuid_2]: secondTestTemporaryPackageInfo,
    };

    const testExternalAttributions: Attributions = {
      [testExternalAttributionUuid]: {
        packageName: 'React',
        packageVersion: '17.0.0',
      },
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': [testManualAttributionUuid_1],
      '/folder2/file1': [testManualAttributionUuid_1],
      '/file1': [testManualAttributionUuid_2],
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/file2': [testExternalAttributionUuid],
      '/folder2/file2': [testExternalAttributionUuid],
    };

    const testStore = createTestAppStore();

    testStore.dispatch(setResources(testResources));
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );
    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testResourcesToExternalAttributions
      )
    );
    testStore.dispatch(setResolvedExternalAttributions(new Set()));
    testStore.dispatch(setAttributionBreakpoints(new Set()));
    testStore.dispatch(setFilesWithChildren(new Set()));

    renderComponentWithStore(<TopProgressBar />, {
      store: testStore,
    });

    const progressBar = screen.getByLabelText('TopProgressBar');
    fireEvent.mouseOver(progressBar);
    act(() => {
      jest.runAllTimers();
    });
    expect(screen.getByText(/Number of files: 6/)).toBeInTheDocument();
    expect(
      screen.getByText(/Files with attributions: 3/) &&
        screen.getByText(/Files with only pre-selected attributions: 1/) &&
        screen.getByText(/Files with only signals: 1/)
    ).toBeDefined();
  });

  it('TopProgressBar does not render when no file has been opened', () => {
    renderComponentWithStore(<TopProgressBar />);
    expect(screen.queryByLabelText('TopProgressBar')).not.toBeInTheDocument();
  });
});
