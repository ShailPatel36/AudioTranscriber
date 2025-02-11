
# Transcriber Pro 🎙️

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-success)](https://transcribe-pro.replit.app/)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

A full-stack audio transcription application that supports multiple AI providers, offering seamless conversion of audio/video files to text with history tracking and export capabilities.


## Features ✨

- 🎧 Support for multiple audio/video formats
- 🤖 Integration with AI providers:
  - AssemblyAI
  - OpenAI Whisper
  - Common Voice
- 📜 Transcription history tracking
- 📤 Export results as TXT, SRT, or JSON
- 🌓 Light/Dark theme toggle
- 🔐 User authentication system
- 📱 Responsive mobile-friendly design
- 🚀 Fast and modern UI components

## Installation 🛠️

```bash
# Clone repository
git clone https://github.com/shailpatel36/transcriber-pro.git
cd shailpatel36-transcriber-pro

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

Configuration ⚙️
Create .env files in both client and server directories:

```server/.env
DATABASE_URL="postgres://user:pass@localhost:5432/transcriber"
SESSION_SECRET="your_session_secret"
ASSEMBLYAI_API_KEY="your_assemblyai_key"
OPENAI_API_KEY="your_openai_key"
STORAGE_PATH="./uploads"
```

client/.env
```env
VITE_API_BASE_URL="http://localhost:3000/api"
```

Running the App ▶️

```bash
# Start server (from server directory)
npm run dev

# Start client (from client directory)
npm run dev
```


Contributing 🤝
Contributions are welcome! Please follow these steps:
```
Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request
```

License 📄
Distributed under the MIT License. See LICENSE for more information.
