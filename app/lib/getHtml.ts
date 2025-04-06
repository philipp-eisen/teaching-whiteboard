'use server'

import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { CoreMessage, generateObject, generateText, UserContent } from 'ai'
import { z } from 'zod'
import { PreviewShape } from '../PreviewShape/PreviewShape'
import { SYSTEM_PROMPT, USER_PROMPT, USER_PROMPT_WITH_PREVIOUS_DESIGN } from '../prompt'
import { generateAnimationDescriptionFromScribble } from './scribble-to-prompt'

const openai = createOpenAI({
	apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

const google = createGoogleGenerativeAI({
	apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
})

const anthropic = createAnthropic({
	apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
})

const gemini25 = google('gemini-2.5-pro-exp-03-25')
const gpt4o = openai('gpt-4o')
const claude37Sonnet = anthropic('claude-3-7-sonnet-20250219')

export async function getHtmlFromAi({
	image,
	text,
	theme = 'light',
	previousPreviews = [],
	generationType = 'text',
}: {
	image: string
	text: string
	theme?: string
	previousPreviews?: PreviewShape[]
	generationType?: 'object' | 'text'
}) {
	const userContent: UserContent = []

	// Add the prompt into
	userContent.push({
		type: 'text',
		text: previousPreviews?.length > 0 ? USER_PROMPT_WITH_PREVIOUS_DESIGN : USER_PROMPT,
	})

	// Add the image
	userContent.push({
		type: 'image',
		image: image,
	})

	// Add the strings of text
	if (text) {
		userContent.push({
			type: 'text',
			text: `Here's a list of text that we found in the design:\n${text}`,
		})
	}

	// Add the previous previews as HTML
	for (let i = 0; i < previousPreviews.length; i++) {
		const preview = previousPreviews[i]
		userContent.push(
			{
				type: 'text',
				text: `The designs also included one of your previous result. Here's the image that you used as its source:`,
			},
			{
				type: 'text',
				text: `And here's the HTML you came up with for it: ${preview.props.html}`,
			}
		)
	}

	// Prompt the theme
	userContent.push({
		type: 'text',
		text: `Please make your result use the ${theme} theme.`,
	})

	userContent.push({
		type: 'text',
		text: `Here's a description of how the image could be animated to explain the concept: ${await generateAnimationDescriptionFromScribble(
			{
				image,
			}
		)}`,
	})

	userContent.push({
		type: 'text',
		text: 'The animation should be interactive. Identify key components or variables that users can manipulate to observe effects. Only output the html. Do not include any other text.',
	})

	userContent.push({
		type: 'text',
		text: '```html',
	})

	const userMessage: CoreMessage = {
		role: 'user',
		content: userContent,
	}

	const params = {
		model: gemini25,
		temperature: 0,
		system: SYSTEM_PROMPT,
		headers: {
			'anthropic-dangerous-direct-browser-access': 'true',
		},
		seed: 42,
		messages: [userMessage],
	}

	if (generationType === 'text') {
		const result = await generateText({
			...params,
			experimental_telemetry: { isEnabled: true },
		})
		console.log(result.reasoningDetails)
		console.log(result.text)
		return removeHtmlMarkdown(result.text)
	} else {
		const result = await generateObject({
			...params,
			experimental_telemetry: { isEnabled: true },
			schema: z.object({
				html: z.string(),
			}),
		})
		return removeHtmlMarkdown(result.object.html)
	}
}

const removeHtmlMarkdown = (html: string) => {
	return html.replace(/^```html\n/, '').replace(/\n```$/, '')
}
