import { Request, Response } from 'express';
import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';

import {
  GITHUB_AI_ENDPOINT,
  GITHUB_AI_MODEL,
  GITHUB_TOKEN,
} from '@/configs/secrets';
import { STATUS_CODE } from '@/constants/statusCodes';
import { errorResponse, successResponse } from '@/utils/responseFormats';

const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TOP_P = 1;

class AiController {
  chat = async (req: Request, res: Response) => {
    if (!GITHUB_TOKEN) {
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            null,
            'Missing GITHUB_TOKEN',
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
      return;
    }

    const {
      messages,
      system,
      user,
      model,
      temperature,
      top_p: topP,
      stream,
    } = req.body ?? {};
    const normalizedMessages = Array.isArray(messages)
      ? messages
          .filter(
            (message: { role?: unknown; content?: unknown }) =>
              message &&
              typeof message === 'object' &&
              typeof message.role === 'string',
          )
          .map((message: { role?: unknown; content?: unknown }) => ({
            role: message.role as string,
            content:
              typeof message.content === 'string'
                ? message.content
                : String(message.content ?? ''),
          }))
      : null;

    const requestMessages =
      normalizedMessages && normalizedMessages.length
        ? normalizedMessages
        : [
            {
              role: 'system',
              content: typeof system === 'string' ? system : '',
            },
            { role: 'user', content: user },
          ];

    const hasUserMessage = requestMessages.some(
      (message) =>
        message.role === 'user' &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0,
    );
    if (!hasUserMessage) {
      res
        .status(STATUS_CODE.CLIENT_ERROR.BAD_REQUEST)
        .json(
          errorResponse(
            null,
            'Missing user message',
            STATUS_CODE.CLIENT_ERROR.BAD_REQUEST,
          ),
        );
      return;
    }

    const endpoint = GITHUB_AI_ENDPOINT.replace(/\/$/, '');
    const requestBody = {
      messages: requestMessages,
      temperature:
        typeof temperature === 'number' ? temperature : DEFAULT_TEMPERATURE,
      top_p: typeof topP === 'number' ? topP : DEFAULT_TOP_P,
      model: typeof model === 'string' && model ? model : GITHUB_AI_MODEL,
      stream: Boolean(stream),
    };

    try {
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': GITHUB_TOKEN,
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        res
          .status(STATUS_CODE.SERVER_ERROR.BAD_GATEWAY)
          .json(
            errorResponse(
              null,
              errorText || 'Upstream error',
              STATUS_CODE.SERVER_ERROR.BAD_GATEWAY,
            ),
          );
        return;
      }

      if (requestBody.stream) {
        res.status(STATUS_CODE.SUCCESS.OK);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        if (typeof res.flushHeaders === 'function') {
          res.flushHeaders();
        }

        if (!response.body) {
          res.end();
          return;
        }

        const readable = Readable.fromWeb(
          response.body as unknown as WebReadableStream<Uint8Array>,
        );
        // Chỉ log ra khi hoàn thành stream

        readable.on('end', () => {
          res.end();
        });
        readable.on('error', () => {
          res.end();
        });
        return;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? '';

      res
        .status(STATUS_CODE.SUCCESS.OK)
        .json(successResponse({ content, contentType: 'markdown' }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res
        .status(STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            null,
            message,
            STATUS_CODE.SERVER_ERROR.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  };
}

export default new AiController();
