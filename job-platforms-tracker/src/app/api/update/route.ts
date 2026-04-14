import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'update-financials.js');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function send(msg: string) {
        controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
      }

      send('Starting update...');

      const proc = spawn('node', [scriptPath], {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'production' },
      });

      proc.stdout.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        lines.forEach((line) => send(line));
      });

      proc.stderr.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        lines.forEach((line) => send(`ERROR: ${line}`));
      });

      proc.on('close', (code) => {
        send(code === 0 ? 'Update complete.' : `Process exited with code ${code}`);
        send('DONE');
        controller.close();
      });

      proc.on('error', (err) => {
        send(`Failed to start script: ${err.message}`);
        send('DONE');
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
