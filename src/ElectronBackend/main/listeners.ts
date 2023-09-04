// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { BrowserWindow, Menu, shell, WebContents } from 'electron';
import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  ExportArgsType,
  ExportCompactBomArgs,
  ExportDetailedBomArgs,
  ExportFollowUpArgs,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
  OpenLinkArgs,
  SaveFileArgs,
  SendErrorInformationArgs,
} from '../../shared/shared-types';
import {
  createListenerCallbackWithErrorHandling,
  getMessageBoxForErrors,
} from '../errorHandling/errorHandling';
import { loadInputAndOutputFromFilePath } from '../input/importFromFile';
import { writeCsvToFile } from '../output/writeCsvToFile';
import {
  GlobalBackendState,
  KeysOfAttributionInfo,
  OpossumOutputFile,
} from '../types/types';
import {
  getGlobalBackendState,
  setGlobalBackendState,
} from './globalBackendState';
import { openFileDialog, selectBaseURLDialog } from './dialogs';
import fs from 'fs';
import { writeSpdxFile } from '../output/writeSpdxFile';
import log from 'electron-log';
import { createMenu } from './menu';
import { parseOutputJsonFile } from '../input/parseFile';
import hash from 'object-hash';
import upath from 'upath';
import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';
import { writeJsonToFile } from '../output/writeJsonToFile';
import { isOpossumFileFormat } from '../utils/isOpossumFileFormat';
import { getLoadedFileType } from '../utils/getLoadedFile';
import { LoadedFileFormat } from '../enums/enums';
import { writeOutputJsonToOpossumFile } from '../output/writeJsonToOpossumFile';
import JSZip from 'jszip';
import zlib from 'zlib';
import {
  OPOSSUM_FILE_COMPRESSION_LEVEL,
  OPOSSUM_FILE_EXTENSION,
} from '../shared-constants';

const outputFileEnding = '_attributions.json';
const jsonGzipFileExtension = '.json.gz';
const jsonFileExtension = '.json';
const dotOpossumFileInputJson = 'input.json';
const dotOpossumFileOutputJson = 'output.json';

export function getSaveFileListener(
  mainWindow: BrowserWindow,
): (_: unknown, args: SaveFileArgs) => Promise<void> {
  return createListenerCallbackWithErrorHandling(
    mainWindow,
    (_: unknown, args: SaveFileArgs) => {
      // 1.56 seconds to reach here
      console.log(Date.now());
      console.log("entered save file listener");

      const globalBackendState = getGlobalBackendState();

      if (globalBackendState.projectId === undefined) {
        throw new Error(
          'Failed to save data. The projectId is incorrect.' +
          `\nprojectId: ${globalBackendState.projectId}`,
        );
      }

      const outputFileContent: OpossumOutputFile = {
        metadata: {
          projectId: globalBackendState.projectId,
          fileCreationDate: String(Date.now()),
          inputFileMD5Checksum: globalBackendState.inputFileChecksum,
        },
        manualAttributions: args.manualAttributions,
        resourcesToAttributions: args.resourcesToAttributions,
        resolvedExternalAttributions: Array.from(
          args.resolvedExternalAttributions,
        ),
      };

      console.log(new Date());
      console.log("3");

      writeOutputJsonToFile(outputFileContent);

      console.log(new Date());
      console.log("left listener");
    },
  );
}

function writeOutputJsonToFile(outputFileContent: OpossumOutputFile): void {
  const globalBackendState = getGlobalBackendState();
  const fileLoadedType = getLoadedFileType(globalBackendState);
  if (fileLoadedType === LoadedFileFormat.Opossum) {
    writeOutputJsonToOpossumFile(
      globalBackendState.opossumFilePath as string,
      outputFileContent,
    );
  } else {
    writeJsonToFile(
      globalBackendState.attributionFilePath as string,
      outputFileContent,
    );
  }
}

export function getOpenFileListener(
  mainWindow: BrowserWindow,
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(mainWindow, async () => {
    const filePaths = openFileDialog();
    if (!filePaths || filePaths.length < 1) {
      return;
    }
    let filePath = filePaths[0];

    if (filePath.endsWith(outputFileEnding)) {
      filePath = tryToGetInputFileFromOutputFile(filePath);
    }

    await handleOpeningFile(mainWindow, filePath);
  });
}

export async function handleOpeningFile(
  mainWindow: BrowserWindow,
  filePath: string,
): Promise<void> {
  const isOpossumFormat = isOpossumFileFormat(filePath);
  log.info('Initializing global backend state');
  initializeGlobalBackendState(filePath, isOpossumFormat);

  if (!isOpossumFormat) {
    const dotOpossumFilePath = getDotOpossumFilePath(filePath);
    if (fs.existsSync(dotOpossumFilePath)) {
      initializeGlobalBackendState(dotOpossumFilePath, !isOpossumFormat);
    }
    mainWindow.webContents.send(AllowedFrontendChannels.ShowFileSupportPopup, {
      showFileSupportPopup: true,
      dotOpossumFileAlreadyExists: fs.existsSync(dotOpossumFilePath),
    });
    return;
  }

  log.info('Opening .opossum file');
  await openFile(mainWindow, filePath);
}

function getActualAndParsedChecksums(resourceFilePath: string): {
  actualInputFileChecksum: string;
  parsedInputFileChecksum: string;
} {
  const manualAttributionFilePath = getFilePathWithAppendix(
    resourceFilePath,
    outputFileEnding,
  );
  const inputFileContent = fs.readFileSync(resourceFilePath, 'utf8');
  const actualInputFileChecksum = hash.MD5(inputFileContent);
  let parsedInputFileChecksum = '';

  if (fs.existsSync(manualAttributionFilePath)) {
    const opossumOutputData = parseOutputJsonFile(manualAttributionFilePath);
    parsedInputFileChecksum =
      opossumOutputData.metadata.inputFileMD5Checksum ?? '';
  }
  return { actualInputFileChecksum, parsedInputFileChecksum };
}

function initializeGlobalBackendState(
  filePath: string,
  isOpossumFormat: boolean,
  inputFileChecksum?: string,
): void {
  const newGlobalBackendState: GlobalBackendState = {
    resourceFilePath: isOpossumFormat ? undefined : filePath,
    attributionFilePath: isOpossumFormat
      ? undefined
      : getFilePathWithAppendix(filePath, outputFileEnding),
    opossumFilePath: isOpossumFormat ? filePath : undefined,
    followUpFilePath: getFilePathWithAppendix(filePath, '_follow_up.csv'),
    compactBomFilePath: getFilePathWithAppendix(
      filePath,
      '_compact_component_list.csv',
    ),
    detailedBomFilePath: getFilePathWithAppendix(
      filePath,
      '_detailed_component_list.csv',
    ),
    spdxYamlFilePath: getFilePathWithAppendix(filePath, '.spdx.yaml'),
    spdxJsonFilePath: getFilePathWithAppendix(filePath, '.spdx.json'),
    inputFileChecksum,
  };
  setGlobalBackendState(newGlobalBackendState);
}

export function getKeepFileListener(
  mainWindow: BrowserWindow,
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(mainWindow, async () => {
    const filePath = getGlobalBackendState().resourceFilePath as string;
    log.info('Opening file: ', filePath);
    await openFile(mainWindow, filePath);
  });
}

export function getDeleteAndCreateNewAttributionFileListener(
  mainWindow: BrowserWindow,
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(mainWindow, async () => {
    const globalBackendState = getGlobalBackendState();
    const resourceFilePath = globalBackendState.resourceFilePath as string;

    log.info(
      'Deleting attribution file and opening input file: ',
      resourceFilePath,
    );
    if (globalBackendState.attributionFilePath) {
      fs.unlinkSync(globalBackendState.attributionFilePath);
    } else {
      throw new Error(
        'Failed to delete output file. Attribution file path is incorrect:' +
        `\n${globalBackendState.attributionFilePath}`,
      );
    }
    await openFile(mainWindow, resourceFilePath);
  });
}

export function getSelectBaseURLListener(
  mainWindow: BrowserWindow,
): () => void {
  return createListenerCallbackWithErrorHandling(mainWindow, () => {
    const baseURLs = selectBaseURLDialog();
    if (!baseURLs || baseURLs.length < 1) {
      return;
    }
    const baseURL = baseURLs[0];
    const formattedBaseURL = formatBaseURL(baseURL);

    mainWindow.webContents.send(AllowedFrontendChannels.SetBaseURLForRoot, {
      baseURLForRoot: formattedBaseURL,
    });
  });
}

function formatBaseURL(baseURL: string): string {
  return 'file://' + baseURL + '/{path}';
}

function tryToGetInputFileFromOutputFile(filePath: string): string {
  const outputFilePattern = `(${outputFileEnding})$`;
  const outputFileRegex = new RegExp(outputFilePattern);

  return fs.existsSync(filePath.replace(outputFileRegex, jsonFileExtension))
    ? filePath.replace(outputFileRegex, jsonFileExtension)
    : fs.existsSync(filePath.replace(outputFileRegex, jsonGzipFileExtension))
      ? filePath.replace(outputFileRegex, jsonGzipFileExtension)
      : filePath;
}

export async function openFile(
  mainWindow: BrowserWindow,
  filePath: string,
): Promise<void> {
  setLoadingState(mainWindow.webContents, true);

  try {
    await loadInputAndOutputFromFilePath(mainWindow, filePath);
    setTitle(mainWindow, filePath);
    mainWindow.removeMenu();
    Menu.setApplicationMenu(createMenu(mainWindow));
  } finally {
    setLoadingState(mainWindow.webContents, false);
  }
}

function setTitle(mainWindow: BrowserWindow, filePath: string): void {
  const defaultTitle = 'OpossumUI';

  mainWindow.setTitle(
    getGlobalBackendState().projectTitle ||
    decodeURIComponent(
      upath.toUnix(filePath).split('/').pop() || defaultTitle,
    ),
  );
}

export function getSendErrorInformationListener(
  mainWindow: BrowserWindow,
): (_: unknown, args: SendErrorInformationArgs) => Promise<void> {
  return async (_, args: SendErrorInformationArgs): Promise<void> => {
    log.error(args.error.message + args.errorInfo.componentStack);
    await getMessageBoxForErrors(
      args.error.message,
      args.errorInfo.componentStack,
      mainWindow,
      false,
    );
  };
}

export function linkHasHttpSchema(link: string): boolean {
  const url = new URL(link);
  return url.protocol === 'https:' || url.protocol === 'http:';
}

export function getOpenLinkListener(): (
  _: unknown,
  args: OpenLinkArgs,
) => Promise<Error | void> {
  return async (_, args: OpenLinkArgs): Promise<Error | void> => {
    try {
      if (!linkHasHttpSchema(args.link)) {
        throw new Error(`Invalid URL ${args.link}`);
      }
      // Does not throw on Linux if link cannot be opened.
      // see https://github.com/electron/electron/issues/28183
      return await shell.openExternal(args.link);
    } catch (error: unknown) {
      if (error instanceof Error) {
        log.info(`Cannot open link ${args.link}\n` + error.message);
        return error;
      } else {
        log.info(`Cannot open link ${args.link}`);
        return new Error('Cannot open link');
      }
    }
  };
}

interface FileExporterAndExportedFilePath<T> {
  exportedFilePath: string | undefined;
  fileExporter: (filePath: string, args: T) => Promise<void> | void;
}

export function getExportedFilePathAndFileExporter(
  exportType: ExportType,
): FileExporterAndExportedFilePath<
  | ExportFollowUpArgs
  | ExportCompactBomArgs
  | ExportDetailedBomArgs
  | ExportSpdxDocumentYamlArgs
  | ExportSpdxDocumentJsonArgs
>;
export function getExportedFilePathAndFileExporter(
  exportType: ExportType,
):
  | FileExporterAndExportedFilePath<ExportFollowUpArgs>
  | FileExporterAndExportedFilePath<ExportCompactBomArgs>
  | FileExporterAndExportedFilePath<ExportDetailedBomArgs>
  | FileExporterAndExportedFilePath<ExportSpdxDocumentYamlArgs>
  | FileExporterAndExportedFilePath<ExportSpdxDocumentJsonArgs> {
  const globalBackendState = getGlobalBackendState();

  switch (exportType) {
    case ExportType.FollowUp:
      return {
        exportedFilePath: globalBackendState.followUpFilePath,
        fileExporter: createFollowUp,
      };
    case ExportType.CompactBom:
      return {
        exportedFilePath: globalBackendState.compactBomFilePath,
        fileExporter: createCompactBom,
      };
    case ExportType.DetailedBom:
      return {
        exportedFilePath: globalBackendState.detailedBomFilePath,
        fileExporter: createDetailedBom,
      };
    case ExportType.SpdxDocumentYaml:
      return {
        exportedFilePath: globalBackendState.spdxYamlFilePath,
        fileExporter: writeSpdxFile,
      };
    case ExportType.SpdxDocumentJson:
      return {
        exportedFilePath: globalBackendState.spdxJsonFilePath,
        fileExporter: writeSpdxFile,
      };
  }
}

export function _exportFileAndOpenFolder(mainWindow: BrowserWindow) {
  return async (_: unknown, exportArgs: ExportArgsType): Promise<void> => {
    const { exportedFilePath, fileExporter } =
      getExportedFilePathAndFileExporter(exportArgs.type);

    setLoadingState(mainWindow.webContents, true);

    try {
      if (exportedFilePath) {
        log.info(
          `Starting to create ${exportArgs.type} export to ${exportedFilePath}`,
        );
        await fileExporter(exportedFilePath, exportArgs);
      } else {
        log.error(`Failed to create ${exportArgs.type} export.`);
        throw new Error(`Failed to create ${exportArgs.type} export.`);
      }
    } finally {
      setLoadingState(mainWindow.webContents, false);

      if (exportedFilePath) {
        log.info(`... Successfully created ${exportArgs.type} export`);
        shell.showItemInFolder(exportedFilePath);
      }
    }
  };
}

export function getExportFileListener(
  mainWindow: BrowserWindow,
): (_: unknown, args: ExportArgsType) => Promise<void> {
  return createListenerCallbackWithErrorHandling(
    mainWindow,
    _exportFileAndOpenFolder(mainWindow),
  );
}

async function createFollowUp(
  followUpFilePath: string,
  args: ExportFollowUpArgs,
): Promise<void> {
  const followUpColumnOrder: Array<KeysOfAttributionInfo> = [
    'packageName',
    'packageVersion',
    'url',
    'copyright',
    'licenseName',
    'resources',
  ];

  await writeCsvToFile(
    followUpFilePath,
    args.followUpAttributionsWithResources,
    followUpColumnOrder,
    true,
  );
}

async function createCompactBom(
  compactBomFilePath: string,
  args: ExportCompactBomArgs,
): Promise<void> {
  const miniBomColumnOrder: Array<KeysOfAttributionInfo> = [
    'packageName',
    'packageVersion',
    'licenseName',
    'copyright',
    'url',
  ];

  await writeCsvToFile(
    compactBomFilePath,
    args.bomAttributions,
    miniBomColumnOrder,
  );
}

async function createDetailedBom(
  detailedBomFilePath: string,
  args: ExportDetailedBomArgs,
): Promise<void> {
  const detailedBomColumnOrder: Array<KeysOfAttributionInfo> = [
    'packageName',
    'packageVersion',
    'packageNamespace',
    'packageType',
    'packagePURLAppendix',
    'url',
    'copyright',
    'licenseName',
    'licenseText',
    'resources',
  ];

  await writeCsvToFile(
    detailedBomFilePath,
    args.bomAttributionsWithResources,
    detailedBomColumnOrder,
  );
}

export function setLoadingState(
  webContents: WebContents,
  isLoading: boolean,
): void {
  webContents.send(AllowedFrontendChannels.FileLoading, {
    isLoading,
  });
}

export function getConvertInputFileToDotOpossumAndOpenListener(
  mainWindow: BrowserWindow,
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(mainWindow, async () => {
    log.info('Converting file with outdated format to .opossum format');

    const isOpossumFormat = true;
    const globalBackendState = getGlobalBackendState();
    const resourceFilePath = globalBackendState.resourceFilePath;

    if (!resourceFilePath) {
      throw new Error(`Resource file path is invalid: ${resourceFilePath}`);
    }

    const dotOpossumFilePath = getDotOpossumFilePath(resourceFilePath);
    const inputJson = getInputJson(resourceFilePath);

    const dotOpossumArchive = new JSZip();
    const dotOpossumWriteStream = fs.createWriteStream(dotOpossumFilePath);
    dotOpossumArchive.file(dotOpossumFileInputJson, inputJson);

    addOutputJsonFileToDotOpossum(resourceFilePath, dotOpossumArchive);

    await dotOpossumArchive
      .generateAsync({
        type: 'nodebuffer',
        streamFiles: true,
        compression: 'DEFLATE',
        compressionOptions: { level: OPOSSUM_FILE_COMPRESSION_LEVEL },
      })
      .then((output) => dotOpossumWriteStream.write(output));

    log.info('Updating global backend state');
    initializeGlobalBackendState(dotOpossumFilePath, isOpossumFormat);

    log.info('Opening .opossum file');
    await openFile(mainWindow, dotOpossumFilePath);
  });
}

function getDotOpossumFilePath(resourceFilePath: string): string {
  let fileExtension: string;
  if (resourceFilePath.endsWith(jsonGzipFileExtension)) {
    fileExtension = jsonGzipFileExtension;
  } else {
    fileExtension = jsonFileExtension;
  }
  const resourceFilePathWithoutFileExtension = resourceFilePath.slice(
    0,
    -fileExtension.length,
  );

  return resourceFilePathWithoutFileExtension + OPOSSUM_FILE_EXTENSION;
}

function getInputJson(resourceFilePath: string): string {
  let inputJson: string;
  if (resourceFilePath.endsWith(jsonGzipFileExtension)) {
    const file = fs.readFileSync(resourceFilePath);
    inputJson = zlib.gunzipSync(file).toString();
  } else {
    inputJson = fs.readFileSync(resourceFilePath, {
      encoding: 'utf-8',
    });
  }

  return inputJson;
}

function addOutputJsonFileToDotOpossum(
  resourceFilePath: string,
  dotOpossumArchive: JSZip,
): void {
  const expectedAssociatedAttributionFilePath = getFilePathWithAppendix(
    resourceFilePath,
    outputFileEnding,
  );
  if (fs.existsSync(expectedAssociatedAttributionFilePath)) {
    const outputJson = fs.readFileSync(expectedAssociatedAttributionFilePath, {
      encoding: 'utf-8',
    });
    dotOpossumArchive.file(dotOpossumFileOutputJson, outputJson);
  }
}

export function getOpenOutdatedInputFileListener(
  mainWindow: BrowserWindow,
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(mainWindow, async () => {
    const isOpossumFormat = false;
    const globalBackendState = getGlobalBackendState();
    const resourceFilePath = globalBackendState.resourceFilePath;

    if (!resourceFilePath) {
      throw new Error(`Resource file path is invalid: ${resourceFilePath}`);
    }

    const checksums = getActualAndParsedChecksums(resourceFilePath);

    log.info('Update global backend state');
    initializeGlobalBackendState(
      resourceFilePath,
      isOpossumFormat,
      checksums?.actualInputFileChecksum,
    );

    const inputFileChanged =
      !isOpossumFormat &&
      checksums &&
      checksums.parsedInputFileChecksum &&
      checksums.actualInputFileChecksum !== checksums.parsedInputFileChecksum;

    if (inputFileChanged) {
      log.info('Checksum of the input file has changed.');
      mainWindow.webContents.send(
        AllowedFrontendChannels.ShowChangedInputFilePopup,
        {
          showChangedInputFilePopup: true,
        },
      );
    } else {
      log.info('Checksum of the input file has not changed.');
      log.info('Opening file with old format (not .opossum)');
      await openFile(mainWindow, resourceFilePath);
    }
  });
}

export function getOpenDotOpossumFileInsteadListener(
  mainWindow: BrowserWindow,
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(mainWindow, async () => {
    const globalBackendState = getGlobalBackendState();
    const opossumFilePath = globalBackendState.opossumFilePath;
    if (!opossumFilePath) {
      throw new Error(`Resource file path is invalid: ${opossumFilePath}`);
    }
    await openFile(mainWindow, opossumFilePath);
  });
}
