// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { PackageCard } from './PackageCard';

export class ResourceDetails {
  private readonly node: Locator;
  private readonly attributions: Locator;
  private readonly signals: Locator;
  readonly signalsPanel: Locator;
  readonly signalsToggle: Locator;
  readonly signalsInFolderContentPanel: Locator;
  readonly signalsInFolderContentToggle: Locator;
  readonly attributionsInFolderContentPanel: Locator;
  readonly attributionsInFolderContentToggle: Locator;
  readonly openResourceUrlButton: Locator;
  readonly copyPathButton: Locator;
  readonly goBackButton: Locator;
  readonly goForwardButton: Locator;
  readonly overrideParentButton: Locator;
  readonly addNewAttributionButton: Locator;
  readonly localTab: Locator;
  readonly globalTab: Locator;
  readonly attributionCard: PackageCard;
  readonly signalCard: PackageCard;
  readonly pathBar: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('resource details');
    this.attributions = this.node.getByLabel('resource attributions');
    this.signals = this.node.getByLabel('resource signals');
    this.signalsPanel = this.signals.getByLabel('signals panel');
    this.signalsToggle = this.node.getByRole('button', {
      name: 'Signals',
      exact: true,
    });
    this.signalsInFolderContentPanel = this.signals.getByLabel(
      'signals in folder content panel',
    );
    this.signalsInFolderContentToggle = this.node.getByRole('button', {
      name: 'Signals in Folder Content',
      exact: true,
    });
    this.attributionsInFolderContentPanel = this.signals.getByLabel(
      'attributions in folder content panel',
    );
    this.attributionsInFolderContentToggle = this.node.getByRole('button', {
      name: 'Attributions in Folder Content',
      exact: true,
    });
    this.openResourceUrlButton = this.node
      .getByRole('button')
      .getByLabel('link to open');
    this.copyPathButton = this.node.getByRole('button').getByLabel('copy path');
    this.goBackButton = this.node.getByRole('button').getByLabel('go back');
    this.goForwardButton = this.node
      .getByRole('button')
      .getByLabel('go forward');
    this.overrideParentButton = this.attributions.getByRole('button', {
      name: 'override parent',
    });
    this.addNewAttributionButton = this.node.getByLabel(
      'package card Add new attribution',
    );
    this.localTab = this.node.getByLabel('local tab');
    this.globalTab = this.node.getByLabel('global tab');
    this.attributionCard = new PackageCard(this.attributions);
    this.signalCard = new PackageCard(this.signals);
    this.pathBar = this.node.getByLabel('path bar');
  }

  public assert = {
    breadcrumbsAreVisible: async (
      ...breadcrumbs: Array<string>
    ): Promise<void> => {
      await Promise.all(
        breadcrumbs.map((crumb) =>
          expect(this.pathBar.getByText(crumb)).toBeVisible(),
        ),
      );
    },
    breadcrumbsAreHidden: async (
      ...breadcrumbs: Array<string>
    ): Promise<void> => {
      await Promise.all(
        breadcrumbs.map((crumb) =>
          expect(this.pathBar.getByText(crumb)).toBeHidden(),
        ),
      );
    },
    openResourceUrlButtonIsEnabled: async (): Promise<void> => {
      await expect(this.openResourceUrlButton).toBeEnabled();
    },
    openResourceUrlButtonIsDisabled: async (): Promise<void> => {
      await expect(this.openResourceUrlButton).toBeDisabled();
    },
    globalTabIsEnabled: async (): Promise<void> => {
      await expect(this.globalTab).toBeEnabled();
    },
    globalTabIsDisabled: async (): Promise<void> => {
      await expect(this.globalTab).toBeDisabled();
    },
    signalsAccordionIsVisible: async (): Promise<void> => {
      await expect(this.signalsToggle).toBeVisible();
    },
    signalsAccordionIsHidden: async (): Promise<void> => {
      await expect(this.signalsToggle).toBeHidden();
    },
    signalsInFolderContentAccordionIsVisible: async (): Promise<void> => {
      await expect(this.signalsInFolderContentToggle).toBeVisible();
    },
    signalsInFolderContentAccordionIsHidden: async (): Promise<void> => {
      await expect(this.signalsInFolderContentToggle).toBeHidden();
    },
    attributionsInFolderContentAccordionIsVisible: async (): Promise<void> => {
      await expect(this.attributionsInFolderContentToggle).toBeVisible();
    },
    attributionsInFolderContentAccordionIsHidden: async (): Promise<void> => {
      await expect(this.attributionsInFolderContentToggle).toBeHidden();
    },
    overrideParentButtonIsVisible: async (): Promise<void> => {
      await expect(this.overrideParentButton).toBeVisible();
    },
    overrideParentButtonIsHidden: async (): Promise<void> => {
      await expect(this.overrideParentButton).toBeHidden();
    },
    addNewAttributionButtonIsVisible: async (): Promise<void> => {
      await expect(this.addNewAttributionButton).toBeVisible();
    },
    addNewAttributionButtonIsHidden: async (): Promise<void> => {
      await expect(this.addNewAttributionButton).toBeHidden();
    },
    goBackButtonIsDisabled: async (): Promise<void> => {
      await expect(this.goBackButton).toBeDisabled();
    },
    goBackButtonIsEnabled: async (): Promise<void> => {
      await expect(this.goBackButton).toBeEnabled();
    },
    goForwardButtonIsDisabled: async (): Promise<void> => {
      await expect(this.goForwardButton).toBeDisabled();
    },
    goForwardButtonIsEnabled: async (): Promise<void> => {
      await expect(this.goForwardButton).toBeEnabled();
    },
  };

  async openResourceUrl(): Promise<void> {
    await this.openResourceUrlButton.click();
  }

  async gotoLocalTab(): Promise<void> {
    await this.localTab.click();
  }

  async gotoGlobalTab(): Promise<void> {
    await this.globalTab.click();
  }

  async clickOnBreadcrumb(crumb: string): Promise<void> {
    await this.pathBar.getByText(crumb).click();
  }
}
