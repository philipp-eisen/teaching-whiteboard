import { Editor, createShapeId } from 'tldraw'
import { PreviewShape } from '../PreviewShape/PreviewShape'
import { blobToBase64 } from './blobToBase64'
import { getHtmlFromAi } from './getHtml'
import { getTextFromSelectedShapes } from './getSelectionAsText'

export async function makeReal(editor: Editor) {
	// Get the selected shapes (we need at least one)
	const selectedShapes = editor.getSelectedShapes()
	if (selectedShapes.length === 0) throw Error('First select something to make real.')

	// Create the preview shape
	const { maxX, midY } = editor.getSelectionPageBounds()!
	const newShapeId = createShapeId()
	editor.createShape<PreviewShape>({
		id: newShapeId,
		type: 'response',
		x: maxX + 60, // to the right of the selection
		y: midY - (540 * 2) / 3 / 2, // half the height of the preview's initial shape
		props: { html: '' },
	})

	// Get a screenshot of the selected shapes
	const maxSize = 1000
	const bounds = editor.getSelectionPageBounds()
	if (!bounds) throw Error('Could not get bounds of selection.')
	const scale = Math.min(1, maxSize / bounds.width, maxSize / bounds.height)
	const { blob } = await editor.toImage(selectedShapes, {
		scale: scale,
		background: true,
		format: 'jpeg',
	})
	const dataUrl = await blobToBase64(blob!)

	// Get any previous previews among the selected shapes
	// We don't want to use previous previews for now

	// Send everything to OpenAI and get some HTML back
	try {
		const html = await getHtmlFromAi({
			image: dataUrl,
			text: getTextFromSelectedShapes(editor),
			theme: editor.user.getUserPreferences().isDarkMode ? 'dark' : 'light',
		})

		if (html.length < 100) {
			console.warn(html)
			throw Error('Could not generate a design from those wireframes.')
		}

		// Update the shape with the new props
		editor.updateShape<PreviewShape>({
			id: newShapeId,
			type: 'response',
			props: {
				html,
			},
		})

		console.log(`Response: ${html}`)
	} catch (e) {
		// If anything went wrong, delete the shape.
		editor.deleteShape(newShapeId)
		throw e
	}
}

export async function makeRealFix(editor: Editor, dataUrl: string) {
	const selectedShapes = editor.getSelectedShapes()
	if (selectedShapes.length === 0) throw Error('First select something to make real.')

	const html = await getHtmlFromAi({
		image: dataUrl,
		text: getTextFromSelectedShapes(editor),
		theme: editor.user.getUserPreferences().isDarkMode ? 'dark' : 'light',
		fix: true,
	})

	if (html.length < 100) {
		console.warn(html)
		throw Error('Could not generate a design from those wireframes.')
	}

	const { maxX, midY } = editor.getSelectionPageBounds()!
	const newShapeId = createShapeId()
	editor.createShape<PreviewShape>({
		id: newShapeId,
		type: 'response',
		x: maxX + 60, // to the right of the selection
		y: midY - (540 * 2) / 3 / 2, // half the height of the preview's initial shape
		props: { html: '' },
	})

	// Update the shape with the new props
	editor.updateShape<PreviewShape>({
		id: newShapeId,
		type: 'response',
		props: {
			html,
		},
	})

	console.log(`Response: ${html}`)
}
