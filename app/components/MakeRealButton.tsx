import { useCallback, useEffect } from 'react'
import { useEditor, useToasts } from 'tldraw'
import { makeReal, makeRealFix } from '../lib/makeReal'

export function MakeRealButton() {
	const editor = useEditor()
	const { addToast } = useToasts()

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			console.log('handleMessage', event)
			if (event.data.action === 'fix-arrow-screenshot' && event.data.shapeid) {
				console.log('fix-arrow-screenshot', event.data.shapeid)
				try {
					console.log('makeRealFix', event.data.screenshot)
					makeRealFix(editor, event.data.screenshot)
				} catch (e) {
					console.error(e)
				}
			}
		}

		window.addEventListener('message', handleMessage)
		return () => {
			window.removeEventListener('message', handleMessage)
		}
	}, [editor])

	const handleClick = useCallback(async () => {
		try {
			await makeReal(editor)
		} catch (e) {
			console.error(e)
			addToast({
				icon: 'info-circle',
				title: 'Something went wrong',
				description: (e as Error).message.slice(0, 100),
			})
		}
	}, [editor, addToast])

	return (
		<button className="makeRealButton" onClick={handleClick}>
			Animate me
		</button>
	)
}
