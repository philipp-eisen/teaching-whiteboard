import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { CoreMessage, generateText, UserContent } from 'ai'
import { SYSTEM_ENTRYPOINTS } from 'next/dist/shared/lib/constants'

// Initialize the Google Generative AI provider
const google = createGoogleGenerativeAI({
	apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
})

// Select the Gemini model
const geminiFlash = google('gemini-2.0-flash-001')

// System prompt defining the task
// const SYSTEM_PROMPT = `
// You are an expert educational animator and motion designer. Your task is to analyze a static educational drawing provided by a user (often a teacher's sketch or diagram). Your goal is to conceptualize a short, clear animation that brings the drawing to life and effectively explains the underlying concept for a learning context (e.g., for students).

// Follow these steps in your response:

// 1.  **Identify the Concept:** Briefly state the core scientific or educational concept illustrated in the drawing.
// 2.  **Animation Goal:** What specific aspect of the concept will the animation clarify or emphasize?
// 3.  **Key Animated Elements:** Which parts of the drawing should be animated? (e.g., lines, arrows, objects, labels).
// 4.  **Animation Sequence Description:** Describe the animation step-by-step. Detail the motion, timing, and visual changes:
//     *   How do elements appear (fade in, draw on, pop up)?
//     *   How do they move (trace paths, flow, pulse, rotate)?
//     *   Are there changes in color, brightness, or thickness for emphasis?
//     *   Describe the start, middle, and end state, or a key loop.
// 5.  **Design Considerations:** Suggest simple stylistic choices appropriate for an educational animation based on a drawing:
//     *   **Pacing:** Should it be slow and deliberate, or faster to show dynamic interaction?
//     *   **Emphasis:** How can focus be drawn to key parts (e.g., subtle glow, highlighting, temporary pause)?
//     *   **Style:** Should the animation retain the hand-drawn feel, or transition to slightly cleaner graphics? (Generally, aim to respect the original style unless clarity demands otherwise).
//     *   **Interactivity:** Consider if key components could be interactive in a final product (though describe the core animation first).
//     *   **Clarity:** Ensure the underlying concepts are made visually obvious. For instance, if demonstrating shadows, the shadow effect should be distinct and clearly visible.

// Keep the overall description clear, concise and direct (e.g., 2-3 sentences per step) for someone to visualize the animation. Focus on clarity and educational effectiveness.
// `

const SYSTEM_PROMPT = `
Describe the scene for a professional animator. 

Be clear and concise.

Only output the description. Do not include any other text.
`

/**
 * Generates an animation description for a given scribble image using Gemini.
 *
 * @param image - The scribble image data, typically a base64 string or URL.
 * @returns A promise that resolves to the generated text description.
 */
export async function generateAnimationDescriptionFromScribble({
	image,
}: {
	image: string // Expecting base64 data URL or a public URL
}): Promise<string> {
  console.log('Generating animation description from scribble...')
	const userContent: UserContent = []

	// Add the core instruction
	userContent.push({
		type: 'text',
		text: 'Describe how this scribble could be animated to explain a concept.',
	})

	// Add the image
	userContent.push({
		type: 'image',
		image: image, // Pass the image data directly
	})

	const userMessage: CoreMessage = {
		role: 'user',
		content: userContent,
	}

	// Call the AI model to generate text
	const result = await generateText({
		model: geminiFlash,
		maxTokens: 512, // Limit the response length
		temperature: 0.3, // Lower temperature for more focused output
		messages: [userMessage],
		system: SYSTEM_PROMPT,
	})

	console.log('Generated animation description from scribble:', result.text)

	return result.text
}
