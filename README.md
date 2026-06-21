# PaperPilot

AI-powered research paper analysis for students. Upload a PDF and get instant summaries, key findings, methods overview, limitations, and scientific glossary.

## Features

- **PDF Upload**: Drag-and-drop or browse to upload research papers (max 25 MB)
- **AI Analysis**: Powered by OpenAI's GPT-4o-mini for intelligent paper analysis
- **Plain English Summaries**: Get complex research explained in student-friendly language
- **Key Findings**: Automatically extracted and formatted findings
- **Methods Overview**: Clear explanation of experimental approaches and techniques
- **Limitations**: Identified potential weaknesses and methodological concerns
- **Scientific Glossary**: Searchable glossary of important terms with definitions
- **Notes System**: Create, edit, and delete notes that persist locally
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Offline Storage**: All notes saved to browser localStorage - no account required

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes
- **AI**: OpenAI API (GPT-4o-mini)
- **PDF Processing**: pdf.js
- **State Management**: Zustand
- **Storage**: Browser localStorage only

## Prerequisites

- Node.js 18+ and npm (or yarn)
- OpenAI API key (get one at https://platform.openai.com/api-keys)

## Installation

1. **Clone or download the repository**

```bash
cd PaperPilot
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-api-key-here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**IMPORTANT**: Never commit `.env.local` to version control. The API key is sensitive.

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Open the application** in your browser
2. **Upload a research paper** by dragging and dropping a PDF or clicking to browse
3. **Wait for analysis** - The AI will extract text and analyze your paper (30-60 seconds)
4. **Explore tabs** to view:
   - Study Objective
   - Plain English Summary
   - Key Findings
   - Methods Overview
   - Limitations
   - Scientific Glossary
   - Your Notes
5. **Create notes** to save important points and questions
6. **Start over** to analyze another paper

## Project Structure

```
PaperPilot/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # OpenAI analysis endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main application page
├── components/
│   ├── ui/
│   │   └── tabs.tsx              # Tabs component
│   ├── AnalysisTabs.tsx         # Analysis section components
│   ├── NotesTab.tsx             # Notes interface
│   └── PDFUpload.tsx            # PDF upload component
├── lib/
│   ├── pdf-extractor.ts         # PDF text extraction
│   ├── store.ts                 # Zustand store
│   ├── storage.ts               # localStorage utilities
│   ├── types.ts                 # TypeScript type definitions
│   └── utils.ts                 # Utility functions
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key (required for analysis) |
| `NEXT_PUBLIC_API_URL` | Base URL for API calls (defaults to localhost:3000) |

## API Endpoints

### POST `/api/analyze`

Analyzes a research paper and returns structured data.

**Request Body:**
```json
{
  "paperText": "Full extracted text from the PDF"
}
```

**Response:**
```json
{
  "studyObjective": {
    "points": ["objective 1", "objective 2", ...]
  },
  "plainEnglishSummary": {
    "text": "Summary text"
  },
  "keyFindings": [
    { "text": "finding 1" },
    { "text": "finding 2" }
  ],
  "methodsOverview": {
    "text": "Methods explanation"
  },
  "limitations": [
    { "text": "limitation 1" }
  ],
  "glossary": [
    {
      "term": "Term Name",
      "definition": "Brief definition"
    }
  ]
}
```

## Local Storage

The application uses browser localStorage to persist:
- **Current paper analysis**: Stored as `paperpilot_current_paper`
- **User notes**: Stored as `paperpilot_notes`

All data is stored locally on the user's device. No server storage.

## Error Handling

The application handles:
- Invalid PDF files
- Files exceeding size limits
- PDF extraction failures
- OpenAI API rate limits and errors
- Network failures
- Corrupted or empty PDFs

All errors are displayed with helpful, user-friendly messages.

## Limitations & Future Improvements

**Current Limitations:**
- Single user (no accounts or authentication)
- Browser-based storage only (lost if cleared)
- Maximum paper size: 25 MB
- Analysis based on first 15,000 characters to control costs

**Potential Future Features:**
- Cloud storage for papers and notes
- User accounts and authentication
- Paper library/history
- Collaborative notes
- Export to PDF or markdown
- Multi-language support
- Custom AI models
- Batch paper analysis

## Troubleshooting

### "OpenAI API key is not configured"
- Ensure `.env.local` exists in the project root
- Verify `OPENAI_API_KEY` is set correctly
- Restart the development server

### "Failed to extract PDF text"
- Ensure the file is a valid PDF
- Try a different PDF (some scanned PDFs with images may not extract well)
- Check file size (must be under 25 MB)

### Notes not saving
- Make sure you are signed in — notes are saved to your account via the `/api/notes` endpoints
- Verify the `notes` table exists (run `supabase/migrations/006_notes.sql`)
- Check the browser network tab for failed `/api/notes` requests

### Analysis takes a long time
- This is normal - API analysis typically takes 30-60 seconds
- Check your network connection
- Verify OpenAI API is responsive

## Development

### Running Tests
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error messages in browser console
3. Verify OpenAI API key and rate limits

## Notes for Deployment

When deploying to production:

1. **Environment Variables**: Set `OPENAI_API_KEY` in your hosting platform's environment variables
2. **API URL**: Update `NEXT_PUBLIC_API_URL` to your production domain
3. **Security**: Never expose your OpenAI API key in client-side code
4. **Rate Limiting**: Consider adding rate limiting to the `/api/analyze` endpoint
5. **CORS**: If deploying on a different domain, verify CORS is properly configured

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [pdf.js](https://mozilla.github.io/pdf.js/) - PDF processing
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [OpenAI API](https://openai.com/api/) - AI analysis

---

**PaperPilot** - Making research papers accessible to every student. 📚🚀
