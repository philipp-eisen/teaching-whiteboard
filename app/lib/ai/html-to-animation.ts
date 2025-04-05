import {
	ANIMATION_USER_PROMPT,
	ANIMATION_SYSTEM_PROMPT,
	ANIMATION_USER_PROMPT_WITH_PREVIOUS_DESIGN,
} from '@/app/animation-prompt'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import dedent from 'dedent'

export async function sketchToThreeJs(sketch: string) {
	const res = await generateText({
		model: google('gemini-2.5-pro-latest'),
		messages: [
			{
				role: 'system',
				content: ANIMATION_SYSTEM_PROMPT,
			},
			{
				role: 'user',
				content: dedent`
                ${ANIMATION_USER_PROMPT}

                <sketch>
                ${sketch}
                </sketch>
                \`\`\`js
                `,
			},
		],
	})

	return res.text
}

export async function sketchToHTML(sketch: string) {
	const js = await sketchToThreeJs(sketch)
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
        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        animate();
    </script>
</body>

</html>
`

	console.log('html', html)
	return html
}
