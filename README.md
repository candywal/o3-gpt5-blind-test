This is a blind comparison app that calls OpenAI `o3` and `gpt-5` and paraphrases both outputs with Claude Opus 4.1 to neutralize style, then shows two anonymized outputs.

## Getting Started

Configure environment variables:

1. Copy `.env.example` to `.env.local` and set your keys:

```
cp .env.example .env.local
# edit .env.local and set:
# OPENAI_API_KEY=...
# ANTHROPIC_API_KEY=...
```

By default, models are:

- OpenAI reasoning: `o3`
- OpenAI thinking: `gpt-5`
- Anthropic paraphraser: `claude-opus-4-1-20250805`

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Usage:

1. Enter a prompt
2. Click "Run blind compare"
3. Two paraphrased outputs are shown in random order as "Output 1" and "Output 2".

Notes:
- Paraphrasing prompt removes tone/phrasing without altering content, helping you judge substance.
- API keys are read server-side from `.env.local` and never sent to the client.

Model docs:
- OpenAI models: `https://platform.openai.com/docs/models`
- Anthropic models: `https://docs.anthropic.com/en/docs/about-claude/models/overview`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
