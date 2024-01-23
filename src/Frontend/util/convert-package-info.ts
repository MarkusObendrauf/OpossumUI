// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DisplayPackageInfo, PackageInfo } from '../../shared/shared-types';

export function convertPackageInfoToDisplayPackageInfo(
  packageInfo: PackageInfo,
  attributionIds: Array<string>,
  count?: number,
): DisplayPackageInfo {
  const { comment, ...packageInfoWithoutComment } = packageInfo;
  const displayPackageInfo: DisplayPackageInfo = {
    ...packageInfoWithoutComment,
    attributionIds,
  };
  if (comment) {
    displayPackageInfo.comments = [comment];
  }
  if (count !== undefined) {
    displayPackageInfo.count = count;
  }

  return displayPackageInfo;
}

export function convertDisplayPackageInfoToPackageInfo(
  displayPackageInfo: DisplayPackageInfo,
): PackageInfo {
  const { comments, attributionIds, ...packageInfoWithoutComment } =
    displayPackageInfo;

  const packageInfo: PackageInfo = packageInfoWithoutComment;

  if (attributionIds.length <= 1 && comments) {
    packageInfo.comment = comments[0];
  }

  return packageInfo;
}
