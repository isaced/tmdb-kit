import { createInterface } from 'node:readline/promises'

export async function readSecret(prompt: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return (await readStdin()).trim()
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

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}
