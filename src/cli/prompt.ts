import { createInterface } from 'node:readline/promises'

export async function readSecret(prompt: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return readStdinSecret()
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })
  const target = rl as unknown as { _writeToOutput: (value: string) => void }
  const writeToOutput = target._writeToOutput
  target._writeToOutput = () => {}

  try {
    const answer = await rl.question(prompt)
    process.stdout.write('\n')
    return answer.trim()
  } finally {
    target._writeToOutput = writeToOutput
    rl.close()
  }
}

export async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    const answer = (await rl.question(question)).trim().toLowerCase()
    return answer === 'y' || answer === 'yes'
  } finally {
    rl.close()
  }
}

export async function readStdinSecret(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8').trim()
}
