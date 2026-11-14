import type { ApiErrorInfo, GenerateStudyInput, StudySetApiPayload } from '../types/study';
import { validateStudyPayload } from '../utils/studyLogic';

const CLIENT_TIMEOUT_MS = 65000;

export class StudyApiError extends Error {
  readonly detail: ApiErrorInfo;

  constructor(detail: ApiErrorInfo) {
    super(detail.message);
    this.name = 'StudyApiError';
    this.detail = detail;
  }
}

export async function generateStudySet(
  input: GenerateStudyInput,
  externalSignal?: AbortSignal,
): Promise<StudySetApiPayload> {
  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      throw new StudyApiError({
        code: 'REQUEST_CANCELLED',
        message: 'Generation request was cancelled.',
        retryable: true,
      });
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch('/api/study/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    let bodyJson: unknown;
    try {
      bodyJson = await response.json();
    } catch {
      throw new StudyApiError({
        code: 'INVALID_SERVER_RESPONSE',
        message: 'Server returned an unreadable response. Please retry.',
        retryable: true,
        statusCode: response.status,
      });
    }

    if (!response.ok) {
      const errorObj =
        bodyJson &&
        typeof bodyJson === 'object' &&
        'error' in bodyJson &&
        typeof (bodyJson as { error?: unknown }).error === 'object'
          ? ((bodyJson as { error: Record<string, unknown> }).error ?? {})
          : {};

      throw new StudyApiError({
        code: typeof errorObj.code === 'string' ? errorObj.code : 'REQUEST_FAILED',
        message:
          typeof errorObj.message === 'string'
            ? errorObj.message
            : `Request failed with status ${response.status}.`,
        retryable:
          typeof errorObj.retryable === 'boolean' ? errorObj.retryable : response.status >= 500,
        statusCode: response.status,
      });
    }

    try {
      return validateStudyPayload(bodyJson);
    } catch (validationErr) {
      throw new StudyApiError({
        code: 'INVALID_STUDY_CONTRACT',
        message:
          validationErr instanceof Error
            ? validationErr.message
            : 'Study data did not match the expected structure.',
        retryable: true,
      });
    }
  } catch (err) {
    if (err instanceof StudyApiError) {
      throw err;
    }

    if (err instanceof DOMException && err.name === 'AbortError') {
      if (timedOut) {
        throw new StudyApiError({
          code: 'CLIENT_TIMEOUT',
          message:
            'The request took longer than expected and timed out. Please retry with shorter notes.',
          retryable: true,
        });
      }
      throw new StudyApiError({
        code: 'REQUEST_CANCELLED',
        message: 'Generation request was cancelled.',
        retryable: true,
      });
    }

    throw new StudyApiError({
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the MindForge AI server. Check your connection and try again.',
      retryable: true,
    });
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}
