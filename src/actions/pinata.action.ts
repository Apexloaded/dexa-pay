'use server';

import {
  IActionResponse,
  IUploadedFilesMetadata,
  IUploadFilesResponse,
} from '@/interfaces/response.interface';
import { pinata } from '@/libs/pinata';
import { processImage } from './image.action';

export async function uploadFile(formdata: FormData): Promise<IActionResponse> {
  const file = formdata.get('file') as File | null;

  if (!file) {
    return {
      status: false,
      message: 'No file uploaded',
    };
  }

  try {
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
      const { processedFile, metadata } = await processImage(file);
      fileToUpload = processedFile;
    }

    const upload = await pinata.upload.file(fileToUpload);
    return {
      status: true,
      message: 'File uploaded successfully',
      data: upload,
    };
  } catch (error) {
    return {
      status: false,
      message: 'Error uploading file',
    };
  }
}

export async function uploadFiles(
  formdata: FormData
): Promise<IActionResponse> {
  const files = formdata.getAll('files') as File[];

  if (files.length === 0) {
    return {
      status: false,
      message: 'No file uploaded',
    };
  }

  try {
    const processedFiles: File[] = [];
    const metadata: IUploadedFilesMetadata[] = [];

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const { processedFile, metadata: fileMetadata } = await processImage(
          file
        );
        processedFiles.push(processedFile);
        metadata.push(fileMetadata);
      } else {
        // For non-image files, add them as-is
        processedFiles.push(file);
        metadata.push({
          id: file.name,
          fileName: file.name,
          contentType: file.type,
          originalSize: file.size,
          compressedSize: file.size,
        });
      }
    }

    const upload = await pinata.upload.fileArray(processedFiles);
    return {
      status: true,
      message: 'Files uploaded successfully',
      data: { pinned: upload, metadata } as IUploadFilesResponse,
    };
  } catch (error) {
    return {
      status: false,
      message: 'Error uploading files',
    };
  }
}
