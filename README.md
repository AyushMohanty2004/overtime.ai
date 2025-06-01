# Overtime.AI

An AI-powered learning companion application that creates personalized learning plans and provides interactive tutoring using Google's Gemini API.

## Features

- **Personalized Learning Plans**: Generate custom learning plans based on your goals and existing knowledge
- **Interactive Tutoring**: Engage in Socratic dialogue with the AI tutor to master concepts
- **Progress Tracking**: Mark modules as complete as you progress through your learning journey
- **Document Study Mode**: Upload or use demo documents for focused study and Q&A
- **Demo Mode**: Try a pre-configured demo to see the app in action

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- A Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file in the root directory and add your Gemini API key:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

### Running the Application

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

## How to Use

1. **Set a Learning Goal**: Start by telling the AI what you want to learn
2. **Share Your Knowledge**: Let the AI know what you already understand about the topic
3. **Explore Your Plan**: Review the personalized learning plan created for you
4. **Learn Interactively**: Click on a module and engage with the AI tutor
5. **Track Progress**: Mark modules as complete as you master the concepts
6. **Document Mode**: Switch to document mode to study specific materials

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **AI**: Google Gemini API
- **State Management**: React Context API
- **Storage**: Browser localStorage for session persistence

## Project Structure

- `/components`: UI components (ChatWindow, ModuleList, etc.)
- `/lib`: Utility functions and context
- `/pages`: Next.js pages and API routes
- `/styles`: Global CSS and Tailwind configuration
- `/prompts`: Structured prompt templates for Gemini API

## License

This project is licensed under the MIT License - see the LICENSE file for details.
