// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { maybePluralize } from '../maybe-pluralize';

describe('maybePluralize', () => {
  it('uses provided plural', () => {
    expect(maybePluralize(2, 'Deputy', { pluralNoun: 'Deputies' })).toBe(
      '2 Deputies',
    );
  });

  it('makes plural by adding s if no plural is provided', () => {
    expect(maybePluralize(2, 'User')).toBe('2 Users');
  });

  it('uses plural when value is zero', () => {
    expect(maybePluralize(0, 'User')).toBe('0 Users');
  });

  it('does not add suffix when value is 1', () => {
    expect(maybePluralize(1, 'User')).toBe('1 User');
  });
});
