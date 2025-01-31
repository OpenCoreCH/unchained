import fs from 'fs';
import util from 'util';
import { resolve } from 'path';
import { log, LogLevel } from 'meteor/unchained:logger';

const readFile = util.promisify(fs.readFile);

const { DATATRANS_API_MOCKS_PATH } = process.env;

export default (
  endpoint: string,
  merchantId: string,
  secret: string,
): ((path: string) => Promise<Response>) => {
  if (DATATRANS_API_MOCKS_PATH) {
    return async (path): Promise<Response> => {
      try {
        const filePath = resolve(process.env.PWD, DATATRANS_API_MOCKS_PATH, `.${path}.json`);
        const content = await readFile(filePath);
        const json = JSON.parse(content.toString());
        return {
          json: async () => json,
          status: json?.error ? 500 : 204,
        };
      } catch (error) {
        log('DataTrans V2 (makeFetcher) -> Error while trying reading and parsing file', {
          level: LogLevel.Error,
          ...error,
        });
        return {
          json: async () => ({ error: { code: 'MOCK', message: 'MOCK' } }),
          status: 500,
        };
      }
    };
  }

  const token = `${merchantId}:${secret}`;

  return async (path: string, body: unknown): Promise<Response> =>
    fetch(`${endpoint}${path}`, {
      method: body ? 'POST' : 'GET',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(token, 'utf-8').toString('base64')}`,
      },
    });
};
