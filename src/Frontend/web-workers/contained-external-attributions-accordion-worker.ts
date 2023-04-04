// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PanelAttributionData } from '../util/get-contained-packages';
import { AttributionIdsWithCountAndResourceId } from '../types/types';
import { getMergedContainedExternalPackagesWithCount } from '../Components/AggregatedAttributionsPanel/accordion-panel-helpers';
import { AttributionsToHashes } from '../../shared/shared-types';

let cachedExternalData: PanelAttributionData | null = null;
let cachedAttributionsToHashes: AttributionsToHashes | null = null;

self.onmessage = ({
  data: {
    selectedResourceId,
    externalData,
    resolvedExternalAttributions,
    attributionsToHashes,
  },
}): void => {
  // externalData = null is used to empty the cached data
  if (externalData !== undefined) {
    cachedExternalData = externalData;
  }

  if (attributionsToHashes !== undefined) {
    cachedAttributionsToHashes = attributionsToHashes;
  }

  if (selectedResourceId) {
    if (cachedExternalData && cachedAttributionsToHashes) {
      const mergedAttributionIdsWithCount =
        getMergedContainedExternalPackagesWithCount({
          selectedResourceId,
          externalData: cachedExternalData,
          resolvedExternalAttributions,
          attributionsToHashes: cachedAttributionsToHashes,
        });
      const output: AttributionIdsWithCountAndResourceId = {
        resourceId: selectedResourceId,
        attributionIdsWithCount: mergedAttributionIdsWithCount,
      };

      self.postMessage({
        output,
      });
    } else {
      self.postMessage({
        output: null,
      });
    }
  }
};

self.onerror = (): void => {
  cachedExternalData = null;
};
