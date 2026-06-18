import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';

const ADMIN_URL = 'http://127.0.0.1:2525';
const IMPOSTER_PORT = 4545;

let mountebankProcess: ChildProcess | null = null;

async function waitForMountebankReady(timeoutMs = 5000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${ADMIN_URL}/imposters`);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error('Mountebank did not become ready in time');
}

export async function startMountebank() {
  try {
    const response = await fetch(`${ADMIN_URL}/imposters`);
    if (response.ok) {
      return;
    }
  } catch {
    // Start a local process if Mountebank is not already running.
  }

  if (mountebankProcess && !mountebankProcess.killed) {
    await waitForMountebankReady();
    return;
  }

  const binaryPath = path.join(process.cwd(), 'node_modules', '.bin', 'mb');

  mountebankProcess = spawn(binaryPath, ['--port', '2525', '--allowInjection'], {
    stdio: 'ignore',
    detached: true,
  });
  mountebankProcess.unref();

  await waitForMountebankReady();
}

export async function stopMountebank() {
  if (!mountebankProcess || mountebankProcess.killed) {
    return;
  }

  try {
    process.kill(-mountebankProcess.pid!, 'SIGTERM');
  } catch {
    // Ignore cleanup failures for already-closed processes.
  }
  mountebankProcess = null;
}

export async function deleteCertificateImposter() {
  try {
    await fetch(`${ADMIN_URL}/imposters/${IMPOSTER_PORT}`, {
      method: 'DELETE',
    });
  } catch {
    // Ignore delete failures when the admin API is not ready yet.
  }
}

export async function loadCertificateImposter(filePath: string) {
  await startMountebank();

  const body = await readFile(filePath, 'utf8');

  const response = await fetch(`${ADMIN_URL}/imposters`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to load imposter from ${filePath}`);
  }
}
