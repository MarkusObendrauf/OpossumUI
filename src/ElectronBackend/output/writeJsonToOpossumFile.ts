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
  console.log(new Date());
  console.log("started writing");

  // 0.00 seconds
  const unzipResult: fflate.Unzipped = {};
  unzipResult[INPUT_FILE_NAME] = getGlobalBackendState()
    .inputFileRaw as Uint8Array;

  console.log(new Date());
  console.log("A");

  // 0.51 seconds sync
  unzipResult[OUTPUT_FILE_NAME] = fflate.strToU8(
    JSON.stringify(outputfileData),
  );

  console.log(new Date());
  console.log("B");

  // 1.10 seconds sync, 2.26 seconds async
  const zippedData: Uint8Array = await new Promise((resolve) => {
    fflate.zip(
      unzipResult,
      {
        level: OPOSSUM_FILE_COMPRESSION_LEVEL,
        // consume: true
      },
      (err, data) => {
        if (err) throw err;
        resolve(data);
      },
    );
  });

  console.log(new Date());
  console.log("C");

  const writeStream = fs.createWriteStream(opossumfilePath);
  return new Promise((resolve) => {
    writeStream.write(zippedData, (err) => {
      if (err) throw err;
      resolve();
    });
  });
}
