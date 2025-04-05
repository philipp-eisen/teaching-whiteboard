'use server'

import {
	ANIMATION_USER_PROMPT,
	ANIMATION_SYSTEM_PROMPT,
	ANIMATION_USER_PROMPT_WITH_PREVIOUS_DESIGN,
} from '@/app/animation-prompt'
import { generateText, streamText, UserContent } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import dedent from 'dedent'
import { createAnthropic } from '@ai-sdk/anthropic'

const google = createGoogleGenerativeAI({
	apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
})

const anthropic = createAnthropic({
	apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
})

export async function sketchToThreeJs(sketchText: string, sketchImage: string) {
	const userContent: UserContent = [
		{
			type: 'text',
			text: ANIMATION_USER_PROMPT,
		},
	]

	// Add the image
	userContent.push({
		type: 'image',
		image: sketchImage,
	})

	// Add the text
	userContent.push({
		type: 'text',
		text: sketchText,
	})

	console.log(JSON.stringify({ userContent }, null, 2))

	const messages = [
		{
			role: 'system' as const,
			content: ANIMATION_SYSTEM_PROMPT,
		},
		{
			role: 'user' as const,
			content: userContent,
		},
		{
			role: 'user' as const,
			content: dedent`
            <code type="js">
            `,
		},
	]

	console.log('messages', JSON.stringify(messages, null, 2))

	const res = await generateText({
		model: google('gemini-2.5-pro-exp-03-25'),
		// model: anthropic('claude-3-7-sonnet-20250219'),
		messages,
		headers: {
			'anthropic-dangerous-direct-browser-access': 'true',
		},
	})

	console.log('res', res.text)

	let code = ''
	if (res.text.includes('```')) {
		const lines = res.text.split('\n')
		const startIndex = lines.findIndex((line) => line.trim().startsWith('```'))
		const endIndex = lines.findIndex((line, i) => i > startIndex && line.trim().startsWith('```'))

		if (startIndex !== -1 && endIndex !== -1) {
			// Get lines between the backticks, excluding the backtick lines themselves
			code = lines.slice(startIndex + 1, endIndex).join('\n')
		} else {
			throw new Error('Invalid code block format in response')
		}
	} else {
		throw new Error('No code found in response')
	}
	// const code = res.text.split('```js')[1].split('```')[0]
	// let text = ''

	// console.log(messages)
	// const { textStream } = streamText({
	// 	// model: google('gemini-1.5-flash-002'),
	// 	model: anthropic('claude-3-7-sonnet-20250219'),
	// 	messages,
	// 	headers: {
	// 		'anthropic-dangerous-direct-browser-access': 'true',
	// 	},
	// })

	// for await (const chunk of textStream) {
	// 	text += chunk
	// 	console.log(chunk)
	// }

	console.log('here with code', code)
	return code
}

export async function sketchToHTML(sketchText: string, sketchImage: string) {
	const js = await sketchToThreeJs(sketchText, sketchImage)
	console.log('js', js)
	const html = dedent`
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Three.js Box Scene</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
        }

        canvas {
            width: 100%;
            height: 100%;
            display: block;
        }
    </style>
</head>

<body>
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.162.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.162.0/examples/jsm/"
            }
        }
    </script>
    <script type="module">
        ${js}
    </script>
</body>

</html>
`

	console.log('html', html)
	return html
}
