import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express = require('express');
import type { Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

const server = express();

let appInitialized: Promise<void> | null = null;

const initializeApp = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  configureApp(app);

  await app.init();
};

const getServer = async () => {
  appInitialized ??= initializeApp();
  await appInitialized;

  return server;
};

export default async function handler(req: Request, res: Response) {
  const app = await getServer();

  return app(req, res);
}
