import express from 'express';
import { prisma } from '@dashboarduz/db';
import type { Request, Response } from 'express';

const router = express.Router();

// AmoCRM webhook receiver
router.post('/amocrm', async (req: Request, res: Response) => {
  try {
    // TODO: Verify webhook signature
    const signature = req.headers['x-signature'] as string;
    
    // Immediately acknowledge
    res.status(200).json({ received: true });

    // Persist webhook event
    const event = await prisma.webhookEvent.create({
      data: {
        source: 'amocrm',
        eventType: req.body.account?.id ? 'account_update' : 'unknown',
        rawPayload: req.body,
        signature: signature || null,
        processed: false,
      },
    });

    // TODO: Push to Redis queue for processing
    console.log(`Webhook event created: ${event.id}`);

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UTeL VoIP webhook receiver
router.post('/utel', async (req: Request, res: Response) => {
  try {
    // TODO: Verify webhook signature
    res.status(200).json({ received: true });

    const event = await prisma.webhookEvent.create({
      data: {
        source: 'utel',
        eventType: req.body.event_type || 'call_event',
        rawPayload: req.body,
        processed: false,
      },
    });

    // TODO: Process call event and link to lead
    console.log(`UTeL webhook event created: ${event.id}`);

  } catch (error) {
    console.error('UTeL webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Telegram webhook receiver
router.post('/telegram', async (req: Request, res: Response) => {
  try {
    res.status(200).json({ received: true });

    const event = await prisma.webhookEvent.create({
      data: {
        source: 'telegram',
        eventType: 'message',
        rawPayload: req.body,
        processed: false,
      },
    });

    console.log(`Telegram webhook event created: ${event.id}`);

  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
