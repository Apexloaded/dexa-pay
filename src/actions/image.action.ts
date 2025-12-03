'use server';

import sharp from 'sharp';
import { IUploadedFilesMetadata } from '@/interfaces/response.interface';
import ShortUniqueId from 'short-unique-id';
const uid = new ShortUniqueId({
  dictionary: 'hex',
});

export async function processImage(
  file: File
): Promise<{ processedFile: File; metadata: IUploadedFilesMetadata }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const originalSize = buffer.length;

  // Process the image using sharp
  const processedBuffer = await sharp(buffer)
    .webp({ quality: 80, effort: 6 }) // Use WebP format with high effort for better compression
    .toBuffer();

  // If the processed image is still larger than 1MB, apply additional compression
  let finalBuffer = processedBuffer;
  if (processedBuffer.length > 1024 * 1024) {
    const compressionQuality = Math.floor(
      80 * ((1024 * 1024) / processedBuffer.length)
    );
    finalBuffer = await sharp(processedBuffer)
      .webp({ quality: compressionQuality, effort: 6 })
      .toBuffer();
  }

  const newFileName = `${uid.stamp(32)}.webp`;
  const processedFile = new File([finalBuffer], newFileName, {
    type: 'image/webp',
  });

  const metadata: IUploadedFilesMetadata = {
    id: file.name,
    fileName: newFileName,
    contentType: 'image/webp',
    originalSize,
    compressedSize: finalBuffer.length,
  };

  return { processedFile, metadata };
}
