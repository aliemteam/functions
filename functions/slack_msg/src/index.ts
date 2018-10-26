require('dotenv').config();

import { MessageAttachment, WebClient } from '@slack/client';
import { Request, Response } from 'express';

const { ALIEM_API_KEY, SLACK_TOKEN } = process.env;

if (!ALIEM_API_KEY || !SLACK_TOKEN) {
    throw new Error('ALIEM_API_KEY and SLACK_TOKEN env vars must be set');
}

const client = new WebClient(SLACK_TOKEN);

interface Body {
    token: string;
    channel: string;
    message: MessageAttachment;
}

export async function slack_msg(req: Request, res: Response): Promise<Response> {
    try {
        if (req.method !== 'POST') {
            throw new HttpError('Only POST requests are accepted', 405);
        }
        if (!req.is('application/json')) {
            throw new HttpError('Content-Type must be "application/json"', 400);
        }
        if (!req.body) {
            throw new HttpError('Request must have a body', 400);
        }

        const { channel, message, token } = req.body as Body;

        if (!channel || !message || !token) {
            throw new HttpError('Bad request', 400);
        }
        if (token !== ALIEM_API_KEY) {
            throw new HttpError('Invalid credentials', 401);
        }

        const slackReq = await client.chat.postMessage({
            channel,
            text: '',
            attachments: [message],
        });
        if (!slackReq.ok) {
            throw new HttpError(slackReq.error || 'Error hitting slack API', 500);
        }

        return res.sendStatus(200);
    } catch (e) {
        console.error(e);
        return res.status(e.code || 500).send(e.message);
    }
}

class HttpError extends Error {
    constructor(message: string, public code: number) {
        super(message);
    }
}
