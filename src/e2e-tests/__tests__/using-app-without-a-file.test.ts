// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { test } from '../utils';

test('provides expected functionality when no file is open', async ({
  menuBar,
  resourceBrowser,
  topBar,
}) => {
  await menuBar.assert.hasTitle('OpossumUI');
  await resourceBrowser.assert.isHidden();
  await topBar.assert.openFileButtonIsVisible();
  await topBar.assert.modeButtonsAreVisible();
  await topBar.assert.auditViewIsActive();

  await topBar.gotoAttributionView();
  await topBar.assert.attributionViewIsActive();

  await topBar.gotoReportView();
  await topBar.assert.reportViewIsActive();
});
