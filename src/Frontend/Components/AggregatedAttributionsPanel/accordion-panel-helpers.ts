// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  AttributionsToHashes,
  MergedPackageInfo,
  PackageInfo,
} from '../../../shared/shared-types';
import {
  AttributionIdWithCount,
  MergedAttributionWithCount,
} from '../../types/types';
import {
  getContainedExternalPackages,
  PanelAttributionData,
} from '../../util/get-contained-packages';

export function getMergedPackageInfoFromPackageInfo(
  attribution: PackageInfo
): MergedPackageInfo {
  const packageInfoWithoutComment: PackageInfo = { ...attribution };
  delete packageInfoWithoutComment.comment;
  const mergedPackageInfo = <MergedPackageInfo>packageInfoWithoutComment;
  if (attribution.comment !== undefined) {
    mergedPackageInfo.comments = [attribution.comment];
  }

  return mergedPackageInfo;
}

export function getMergedContainedExternalPackagesWithCount(args: {
  selectedResourceId: string;
  externalData: Readonly<PanelAttributionData>;
  resolvedExternalAttributions: Readonly<Set<string>>;
  attributionsToHashes: Readonly<AttributionsToHashes>;
}): Array<AttributionIdWithCount> {
  const attributionIdsWithCount = getContainedExternalPackages(
    args.selectedResourceId,
    args.externalData.resourcesWithAttributedChildren,
    args.externalData.attributions,
    args.externalData.resourcesToAttributions,
    args.resolvedExternalAttributions
  );
  return getMergedAttributionsWithCount(
    attributionIdsWithCount,
    args.externalData.attributions,
    args.attributionsToHashes
  );
}

export function getMergedAttributionsWithCount(
  attributionIdsWithCount: Array<AttributionIdWithCount>,
  attributions: Attributions,
  externalAttributionsToHashes: AttributionsToHashes
): Array<MergedAttributionWithCount> {
  const mergedAttributionIdsWithCount: Array<MergedAttributionWithCount> = [];
  const hashToAttributions: { [hash: string]: Array<[string, PackageInfo]> } =
    {};

  attributionIdsWithCount.forEach(({ attributionId }): void => {
    const attribution: PackageInfo = attributions[attributionId];
    const savedHash = externalAttributionsToHashes[attributionId];

    if (savedHash) {
      if (!hashToAttributions[savedHash]) {
        hashToAttributions[savedHash] = [];
      }
      hashToAttributions[savedHash].push([attributionId, attribution]);
    } else {
      mergedAttributionIdsWithCount.push(
        getMergedAttributionWithCountFromAttributions([
          [attributionId, attribution],
        ])
      );
    }
  });

  Object.keys(hashToAttributions).forEach((hash: string): void => {
    mergedAttributionIdsWithCount.push(
      getMergedAttributionWithCountFromAttributions(hashToAttributions[hash])
    );
  });

  return mergedAttributionIdsWithCount;
}

function getMergedAttributionWithCountFromAttributions(
  attributionsWithIds: Array<[string, PackageInfo]>
): MergedAttributionWithCount {
  const mergedAttributionConfidence: number = Math.min(
    ...attributionsWithIds.map(
      (attributionWithId): number =>
        attributionWithId[1].attributionConfidence || 0
    )
  );
  const comments: Array<string> = attributionsWithIds
    .map((attributionWithId) => attributionWithId[1].comment || '')
    .filter((comment: string | undefined) => comment !== '');
  const originIdsAsSet: Set<string> = attributionsWithIds.reduce(
    (originIdSet, attributionWithId) => {
      (attributionWithId[1].originIds ?? []).forEach((originId: string) =>
        originIdSet.add(originId)
      );
      return originIdSet;
    },
    new Set<string>()
  );
  const originIds: Array<string> = [...originIdsAsSet];

  const originalAttributionIds: Array<string> = attributionsWithIds.map(
    (attributionWithId) => attributionWithId[0]
  );

  const attributionToShow: MergedPackageInfo = {
    ...attributionsWithIds[0][1],
    type: 'MergedPackageInfo',
    attributionConfidence: mergedAttributionConfidence,
    originalAttributionIds,
  };
  delete attributionToShow.comment;
  if (comments.length > 0) {
    attributionToShow.comments = comments;
  }
  if (originIds.length > 0) {
    attributionToShow.originIds = originIds;
  }

  return {
    attributionId: attributionsWithIds[0][0],
    attribution: attributionToShow,
  };
}
