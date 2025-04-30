# Content Moderation API

A Node.js Express API for automated content moderation. Currently implements basic word-based moderation, with plans to integrate AI-based moderation services.

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The server will start on port 3000 by default.

## API Endpoints

### POST /api/moderate

Moderates the provided text content.

**Request Body:**
\`\`\`json
{
  "text": "content to moderate"
}
\`\`\`

**Response:**
\`\`\`json
{
  "flagged": boolean,
  "reason": string | null,
  "severity": "low" | "high"
}
\`\`\`

## Future Improvements

- Integration with Google Perspective API or OpenAI Moderation API
- Additional content types support (images, videos)
- Custom moderation rules configuration
- Rate limiting and authentication
