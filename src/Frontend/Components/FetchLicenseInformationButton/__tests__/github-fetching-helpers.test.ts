// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  convertGithubPayload,
  getGithubAPIUrl,
} from '../github-fetching-helpers';

describe('getGithubAPIUrl', () => {
  it('handles a normal github url', () => {
    expect(getGithubAPIUrl('https://github.com/opossum-tool/OpossumUI')).toBe(
      'https://api.github.com/repos/opossum-tool/OpossumUI/license'
    );
  });

  it('handles a trailing slash', () => {
    expect(getGithubAPIUrl('https://github.com/opossum-tool/OpossumUI/')).toBe(
      'https://api.github.com/repos/opossum-tool/OpossumUI/license'
    );
  });

  it('handles additional parts at the end of the url', () => {
    expect(
      getGithubAPIUrl(
        'https://github.com/opossum-tool/OpossumUI/some/more/suffixes'
      )
    ).toBe('https://api.github.com/repos/opossum-tool/OpossumUI/license');
  });
});

describe('convertGithubPayload', () => {
  it('raises for invalid payload', () => {
    const payload = { license: {} };

    expect(() => convertGithubPayload(payload as unknown as Response)).toThrow(
      'requires property "spdx_id"'
    );
  });

  it('parses payload correctly', () => {
    const payload = {
      license: { spdx_id: 'Apache-2.0' },
      content: 'TGljZW5zZSBUZXh0', // "License Text" in base64
      html_url: 'https://github.com/opossum-tool/OpossumUI/blob/main/LICENSE',
    };

    const packageInfo = convertGithubPayload(payload as unknown as Response);
    expect(packageInfo).toStrictEqual({
      licenseName: 'Apache-2.0',
      licenseText: 'License Text',
      packageType: 'github',
      packageNamespace: 'opossum-tool',
      packageName: 'OpossumUI',
      packagePURLAppendix: undefined,
    });
  });

  it('handles non existing license text correctly', () => {
    const payload = {
      license: { spdx_id: 'Apache-2.0' },
      html_url: 'https://github.com/opossum-tool/OpossumUI/blob/main/LICENSE',
    };

    const packageInfo = convertGithubPayload(payload as unknown as Response);
    expect(packageInfo).toStrictEqual({
      licenseName: 'Apache-2.0',
      packageType: 'github',
      licenseText: undefined,
      packageNamespace: 'opossum-tool',
      packageName: 'OpossumUI',
      packagePURLAppendix: undefined,
    });
  });

  it('handles empty license text correctly', () => {
    const payload = {
      license: { spdx_id: 'Apache-2.0' },
      content: '',
      html_url: 'https://github.com/opossum-tool/OpossumUI/blob/main/LICENSE',
    };

    const packageInfo = convertGithubPayload(payload as unknown as Response);
    expect(packageInfo).toStrictEqual({
      licenseName: 'Apache-2.0',
      packageType: 'github',
      licenseText: undefined,
      packageNamespace: 'opossum-tool',
      packageName: 'OpossumUI',
      packagePURLAppendix: undefined,
    });
  });
});
