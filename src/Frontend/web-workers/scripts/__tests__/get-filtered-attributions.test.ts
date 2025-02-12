// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions, Criticality } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import {
  getFilteredAttributions,
  LOW_CONFIDENCE_THRESHOLD,
} from '../get-filtered-attributions';

describe('get-filtered-attributions', () => {
  it('returns filtered attributions without filter', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 0 },
      [packageInfo2.id]: { ...packageInfo2, count: 0 },
    });
  });

  it('returns attributions with count', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
        attributionsToResources: faker.opossum.attributionsToResources({
          [packageInfo1.id]: [
            faker.opossum.filePath(),
            faker.opossum.filePath(),
          ],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 2 },
      [packageInfo2.id]: { ...packageInfo2, count: 0 },
    });
  });

  it('sorts attributions alphabetically', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      packageName: 'b',
    });
    const packageInfo2 = faker.opossum.packageInfo({
      packageName: 'a',
    });

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(Object.keys(attributions)).toEqual<Array<string>>([
      packageInfo2.id,
      packageInfo1.id,
    ]);
  });

  it('sorts attributions by criticality', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      criticality: Criticality.Medium,
    });
    const packageInfo2 = faker.opossum.packageInfo({
      criticality: Criticality.High,
    });

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      sorting: text.sortings.criticality,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(Object.keys(attributions)).toEqual<Array<string>>([
      packageInfo2.id,
      packageInfo1.id,
    ]);
  });

  it('sorts attributions by frequency', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      sorting: text.sortings.occurrence,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
        attributionsToResources: faker.opossum.attributionsToResources({
          [packageInfo2.id]: [
            faker.opossum.filePath(),
            faker.opossum.filePath(),
          ],
        }),
      }),
    });

    expect(Object.keys(attributions)).toEqual<Array<string>>([
      packageInfo2.id,
      packageInfo1.id,
    ]);
  });

  it('returns filtered attributions based on search term', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      sorting: text.sortings.name,
      search: packageInfo1.packageName!,
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 0 },
    });
  });

  it('returns filtered attributions with needs-follow-up filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      followUp: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.needsFollowUp],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 0 },
    });
  });

  it('returns filtered attributions with pre-selected filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      preSelected: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.preSelected],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 0 },
    });
  });

  it('returns filtered attributions with excluded-from-notice filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      excludeFromNotice: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.excludedFromNotice],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 0 },
    });
  });

  it('returns filtered attributions with low-confidence filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      attributionConfidence: LOW_CONFIDENCE_THRESHOLD,
    });
    const packageInfo2 = faker.opossum.packageInfo({
      attributionConfidence: LOW_CONFIDENCE_THRESHOLD + 1,
    });

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.lowConfidence],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 0 },
    });
  });

  it('returns filtered attributions with first-party filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      firstParty: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.firstParty],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 0 },
    });
  });

  it('returns filtered attributions with third-party filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      firstParty: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.thirdParty],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo2.id]: { ...packageInfo2, count: 0 },
    });
  });

  it('returns filtered attributions with needs-review-by-QA filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      needsReview: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.needsReview],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 0 },
    });
  });

  it('returns filtered attributions with currently-preferred filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      preferred: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.currentlyPreferred],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 0 },
    });
  });

  it('returns filtered attributions with previously-preferred filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      wasPreferred: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.previouslyPreferred],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 0 },
    });
  });

  it('returns filtered attributions with incomplete-attribution filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      packageName: undefined,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.incomplete],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, count: 0 },
    });
  });
});
