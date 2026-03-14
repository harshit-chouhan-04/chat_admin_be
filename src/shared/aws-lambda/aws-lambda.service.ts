import {
  InvokeCommand,
  InvocationType,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@aws-sdk/protocol-http';

export type AwsLambdaInvoiceInvokeResult =
  | {
      mode: 'functionUrl';
      status: number;
      statusText: string;
      requestId?: string;
      data: unknown;
    }
  | {
      mode: 'invoke';
      statusCode?: number;
      requestId?: string;
    };

export type AwsLambdaInvokeMode = 'Event' | 'RequestResponse';

export interface InvokeJsonOptions {
  functionName: string;
  payload: unknown;
  invocationType?: AwsLambdaInvokeMode;
  qualifier?: string;
}

export interface InvokeJsonResult {
  statusCode?: number;
  requestId?: string;
  payload?: unknown;
  rawPayload?: string;
}

@Injectable()
export class AwsLambdaService {
  private readonly logger = new Logger(AwsLambdaService.name);
  private readonly client: LambdaClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    this.client = new LambdaClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
    });
  }

  async invokeJson(options: InvokeJsonOptions): Promise<InvokeJsonResult> {
    const {
      functionName,
      payload,
      invocationType = 'Event',
      qualifier,
    } = options;

    if (!functionName) {
      throw new Error('Missing Lambda function name');
    }

    this.logger.log(
      `Invoking Lambda function "${functionName}" with invocationType="${invocationType}" and qualifier="${qualifier ?? ''}"`,
    );

    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: invocationType as InvocationType,
      Payload: Buffer.from(JSON.stringify(payload)),
      Qualifier: qualifier,
    });

    const response = await this.client.send(command);

    this.logger.log(
      `Lambda invoke completed for "${functionName}" with statusCode=${response.StatusCode} and requestId=${response.$metadata?.requestId || ''}`,
    );

    if (
      invocationType === 'Event' &&
      response.StatusCode &&
      response.StatusCode >= 300
    ) {
      this.logger.warn(
        `Lambda async invoke returned status ${response.StatusCode} for ${functionName}`,
      );
    }

    let rawPayload: string | undefined;
    let parsedPayload: unknown | undefined;

    if (invocationType === 'RequestResponse' && response.Payload) {
      rawPayload = Buffer.from(response.Payload).toString('utf-8');
      try {
        parsedPayload = rawPayload ? JSON.parse(rawPayload) : undefined;
      } catch {
        parsedPayload = undefined;
      }
    }

    return {
      statusCode: response.StatusCode,
      requestId: response.$metadata?.requestId,
      payload: parsedPayload,
      rawPayload,
    };
  }

  private async invokeFunctionUrl(
    functionUrl: string,
    payload: unknown,
  ): Promise<AwsLambdaInvoiceInvokeResult> {
    if (!functionUrl) {
      throw new Error('Missing Lambda function URL');
    }

    const region = this.configService.get<string>('AWS_REGION');
    if (!region) {
      throw new Error('AWS_REGION is required');
    }

    const url = new URL(functionUrl);

    const signer = new SignatureV4({
      credentials: defaultProvider(), // ✅ IAM role, env, STS
      region,
      service: 'lambda',
      sha256: Sha256,
    });

    const request = new HttpRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      method: 'POST',
      path: url.pathname + url.search,
      headers: {
        'content-type': 'application/json',
        host: url.hostname,
      },
      body: JSON.stringify(payload ?? {}),
    });

    const signedRequest = await signer.sign(request);

    const response = await axios({
      method: signedRequest.method,
      url: functionUrl,
      headers: signedRequest.headers,
      data: signedRequest.body,
      validateStatus: () => true,
    });

    const requestIdHeader =
      response.headers?.['x-amzn-requestid'] ??
      response.headers?.['x-amzn-request-id'];
    const requestId =
      typeof requestIdHeader === 'string' ? requestIdHeader : undefined;

    this.logger.log(
      `Lambda Function URL invoked: status=${response.status} ${response.statusText}${requestId ? ` requestId=${requestId}` : ''}`,
    );

    if (response.status >= 400) {
      this.logger.warn(
        `Lambda Function URL returned error status=${response.status}`,
      );
    }

    return {
      mode: 'functionUrl',
      status: response.status,
      statusText: response.statusText,
      requestId,
      data: response.data,
    };
  }

  async invokeInvoicePdfAndEmail(
    payload: unknown,
  ): Promise<AwsLambdaInvoiceInvokeResult> {
    const functionUrl = this.configService.get<string>(
      'INVOICE_LAMBDA_FUNCTION_URL',
    );
    const functionName = this.configService.get<string>(
      'INVOICE_LAMBDA_FUNCTION_NAME',
    );
    const qualifier = this.configService.get<string>(
      'INVOICE_LAMBDA_QUALIFIER',
    );

    const sendEmail = Boolean((payload as any)?.sendEmail);
    const desiredInvocationType: AwsLambdaInvokeMode = sendEmail
      ? 'Event'
      : 'RequestResponse';

    if (functionUrl) {
      try {
        return await this.invokeFunctionUrl(functionUrl, payload);
      } catch (err: any) {
        this.logger.error(
          `Failed to invoke invoice lambda via URL`,
          err?.stack || String(err),
        );
        throw err;
      }
    }

    if (functionName) {
      try {
        const result = await this.invokeJson({
          functionName,
          payload,
          invocationType: desiredInvocationType,
          qualifier,
        });

        return {
          mode: 'invoke',
          statusCode: result.statusCode,
          requestId: result.requestId,
        };
      } catch (err: any) {
        this.logger.error(
          `Failed to invoke invoice lambda (${functionName})`,
          err?.stack || String(err),
        );
        throw err;
      }
    } else {
      this.logger.error(
        'No INVOICE_LAMBDA_FUNCTION_URL or INVOICE_LAMBDA_FUNCTION_NAME configured',
      );
      throw new Error(
        'No INVOICE_LAMBDA_FUNCTION_URL or INVOICE_LAMBDA_FUNCTION_NAME configured',
      );
    }
  }
}
