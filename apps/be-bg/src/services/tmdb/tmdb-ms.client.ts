import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance } from 'axios';

type QueryParams = Record<string, string | number | boolean | undefined>;

type MsErrorBody = {
  message?: string | string[];
  statusCode?: number;
  error?: string;
};

@Injectable()
export class TmdbMsClient {
  private readonly http: AxiosInstance;

  constructor() {
    const baseURL = process.env.TMDB_MS_URL ?? 'http://localhost:3333';
    this.http = axios.create({
      baseURL,
      timeout: 10_000,
    });
  }

  async get<TResponse>(path: string, params?: QueryParams): Promise<TResponse> {
    try {
      const res = await this.http.get<TResponse>(path, { params });
      return res.data;
    } catch (e: unknown) {
      throw this.toHttpException(e);
    }
  }

  private toHttpException(e: unknown): HttpException {
    if (axios.isAxiosError(e)) {
      const err = e as AxiosError<MsErrorBody>;
      const status = err.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const data = err.response?.data;

      const message = this.extractMessage(data) ?? 'TMDB microservice error';
      return new HttpException(message, status);
    }

    return new HttpException(
      'TMDB microservice error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private extractMessage(data: MsErrorBody | undefined): string | undefined {
    if (!data) return undefined;

    // Nest peut renvoyer message: string | string[]
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.message)) return data.message.join(', ');

    if (typeof data.error === 'string') return data.error;
    return undefined;
  }
}
