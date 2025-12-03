import { PinResponse } from "pinata-web3";

export interface IActionResponse {
  status: boolean;
  message?: string;
  data?: any;
}

export interface ErrorResponse {
  errors: string;
}

export type AsyncFunction = (...args: any[]) => Promise<any>;

export type IUploadedFilesMetadata = {
  id: string;
  fileName: string;
  contentType: string;
  originalSize?: number;
  compressedSize?: number;
};

export type IUploadFilesResponse = {
  pinned: PinResponse;
  metadata: IUploadedFilesMetadata[];
};
