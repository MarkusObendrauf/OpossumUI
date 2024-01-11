// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { View } from '../../../enums/enums';
import { navigateToView } from '../../../state/actions/view-actions/view-actions';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../../state/selectors/audit-view-resource-selectors';
import { getSelectedView } from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { ResourcesListBatch } from '../../../types/types';
import { ResourcesList } from '../ResourcesList';

describe('The ResourcesList', () => {
  const resourceIdsOfSelectedAttributionId = [
    '/folder1/folder2/resource_1',
    'resource_2',
  ];

  const resourcesListBatches: Array<ResourcesListBatch> = [
    { resourceIds: resourceIdsOfSelectedAttributionId },
  ];

  const expectedExpandedIds = [
    '/',
    '/folder1/',
    '/folder1/folder2/',
    '/folder1/folder2/resource_1',
  ];

  it('component renders', () => {
    renderComponent(
      <ResourcesList resourcesListBatches={resourcesListBatches} />,
    );
    expect(screen.getByText('/folder1/folder2/resource_1')).toBeInTheDocument();
    expect(screen.getByText('resource_2')).toBeInTheDocument();
  });

  it('clicking on a path changes the view, selectedResourceId and expandedResources without user callback', () => {
    const { store } = renderComponent(
      <ResourcesList resourcesListBatches={resourcesListBatches} />,
    );
    store.dispatch(navigateToView(View.Attribution));
    const examplePath = '/folder1/folder2/resource_1';

    fireEvent.click(screen.getByText(examplePath));

    expect(getSelectedResourceId(store.getState())).toBe(examplePath);
    expect(getSelectedView(store.getState())).toBe(View.Audit);
    expect(getExpandedIds(store.getState())).toMatchObject(expectedExpandedIds);
  });

  it('clicking on a path changes the view, selectedResourceId and expandedResources with user callback', () => {
    const onClickCallback = jest.fn();
    const { store } = renderComponent(
      <ResourcesList
        resourcesListBatches={resourcesListBatches}
        onClickCallback={onClickCallback}
      />,
    );
    store.dispatch(navigateToView(View.Attribution));
    const examplePath = '/folder1/folder2/resource_1';

    fireEvent.click(screen.getByText(examplePath));

    expect(onClickCallback).toHaveBeenCalled();
    expect(getSelectedResourceId(store.getState())).toBe(examplePath);
    expect(getSelectedView(store.getState())).toBe(View.Audit);
    expect(getExpandedIds(store.getState())).toMatchObject(expectedExpandedIds);
  });
});
