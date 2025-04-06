# Explainimator

Teachers can now create explainer animations with AI, from sketches & vibes.

Turn your rough sketches into engaging, interactive animations for the classroom. Simply draw your idea, and our AI transforms it into a polished, educational animation that helps concepts come alive for students.

Perfect for visual learners, complex topics, and adding dynamic elements to your lessons without the need for complex animation tools or technical expertise.

# How to run

1. Run `pnpm install` to install dependencies
2. Change the `.env.local` file to your own Google GEMINI api key `NEXT_PUBLIC_GOOGLE_API_KEY=KEY HERE`
3. Run `pnpm dev`
4. Open [localhost:3000](http://localhost:3000) and animate some experiments!

## How the AI works

Explainimator is built with the [tldraw SDK](https://tldraw.dev), a React library for creating whiteboards and other infinite canvas experiences.

Explainimator uses multiple AI models to transform your sketches into interactive animations:

1. **Input Processing**: When you draw a sketch, Gemini 2.0 Flash analyzes the image and describes it

2. **Animation Generation**: Gemini 2.5 Pro converts your sketch into interactive HTML/CSS/JS animations
