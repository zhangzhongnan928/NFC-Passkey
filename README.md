# NFC Passkey Demo

This project demonstrates a small web app that interacts with the Privy JS SDK. The build system uses [Parcel](https://parceljs.org/).

## Prerequisites

- [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) must be installed.

## Installation

Install the project dependencies:

```bash
npm install
```

## Building

To produce a production build run:

```bash
npm run build
```

**Note:** Parcel needs to download a platform-specific Rust bundle during its first build. If the environment does not have network access at build time the process will fail.

## Running

Start the development server:

```bash
npm start
```

This will run Parcel in development mode and open the app locally.

