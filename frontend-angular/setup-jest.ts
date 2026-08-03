


// jsdom de jest no expone los globals del runtime de Node que firebase/auth necesita
// (TextDecoder/TextEncoder/fetch) al importarse. Se restauran desde el runtime.
const { TextDecoder: NodeTextDecoder, TextEncoder: NodeTextEncoder } = require('node:util');
const { ReadableStream: NodeReadableStream, WritableStream: NodeWritableStream, TransformStream: NodeTransformStream } = require('node:stream/web');
const { MessageChannel: NodeMessageChannel, MessagePort: NodeMessagePort } = require('node:worker_threads');
if (typeof globalThis.MessageChannel !== 'function') globalThis.MessageChannel = NodeMessageChannel;
if (typeof globalThis.MessagePort !== 'function') globalThis.MessagePort = NodeMessagePort;
if (typeof globalThis.ReadableStream !== 'function') globalThis.ReadableStream = NodeReadableStream;
if (typeof globalThis.WritableStream !== 'function') globalThis.WritableStream = NodeWritableStream;
if (typeof globalThis.TransformStream !== 'function') globalThis.TransformStream = NodeTransformStream;
if (typeof globalThis.TextDecoder !== 'function') globalThis.TextDecoder = NodeTextDecoder;
if (typeof globalThis.TextEncoder !== 'function') globalThis.TextEncoder = NodeTextEncoder;
if (typeof globalThis.fetch !== 'function') {
  const { fetch, Headers, Request, Response } = require('undici');
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
