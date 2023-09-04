// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as fflate from 'fflate';
import fs from 'fs';
import {
  INPUT_FILE_NAME,
  OPOSSUM_FILE_COMPRESSION_LEVEL,
  OUTPUT_FILE_NAME,
} from '../shared-constants';
import { getGlobalBackendState } from '../main/globalBackendState';

export async function writeOutputJsonToOpossumFile(
  opossumfilePath: string,
  outputfileData: unknown,
): Promise<void> {
  const inputFileDataToConsume =
    getGlobalBackendState().inputFileRaw?.slice() as Uint8Array;
  const outputFileDataToConsume = fflate.strToU8(
    JSON.stringify(outputfileData),
  );

  const unzipResult: fflate.Unzipped = {
    [INPUT_FILE_NAME]: inputFileDataToConsume,
    [OUTPUT_FILE_NAME]: outputFileDataToConsume,
  };

  const zippedData: Uint8Array = await new Promise((resolve) => {
    fflate.zip(
      unzipResult,
      {
        level: OPOSSUM_FILE_COMPRESSION_LEVEL,
        consume: true,
      },
      (err, data) => {
        if (err) throw err;
        resolve(data);
      },
    );
  });

  const writeStream = fs.createWriteStream(opossumfilePath);
  return new Promise((resolve) => {
    writeStream.write(zippedData, (err) => {
      if (err) throw err;
      resolve();
    });
  });
}
