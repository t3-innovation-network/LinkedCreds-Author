This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Initial Setup

```bash
npm install --legacy-peer-deps
cp example.env .env.local
```

### Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Enabling Login with NextAuth and Google Drive Integration

Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET` in .env.local from a Google Cloud project with Drive integration and test user enabled. If you don't already have access to this, follow these steps starting at https://console.cloud.google.com/:

* Create a new project from project menu, open the new project
* Open Main Menu (upper-left) -> APIs & Services -> Library
* Open "Google Drive API" in center card view, then click "Enable" button
* Open "Oauth consent screen" in left menu, click "get started"
* Enter App name, User support email, pick Audience -> External, ..., create
* Under "Test users" click "+ Add users" and add your Gmail account
* Open "Clients" in left menu, add Web Application type
* Add `http://localhost:3000` to "Authorized JavaScript origins"
* Add `http://localhost:3000/api/auth/callback/google` to "Authorized Redirect URIs"
* Copy the "Client ID" and "Client secret" to the variables in `.env.local`

### Custom Font

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

### Setting up Google Cloud Project with Drive Integration

Create a project 

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
