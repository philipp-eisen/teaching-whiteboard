/* eslint-disable react-hooks/rules-of-hooks */
import { ReactElement } from 'react'
import {
	BaseBoxShapeUtil,
	DefaultSpinner,
	HTMLContainer,
	stopEventPropagation,
	SvgExportContext,
	TLBaseShape,
	TldrawUiIcon,
	toDomPrecision,
	useIsEditing,
	useToasts,
	useValue,
	Vec,
} from 'tldraw'

export type PreviewShape = TLBaseShape<
	'response',
	{
		html: string
		w: number
		h: number
	}
>

export class PreviewShapeUtil extends BaseBoxShapeUtil<PreviewShape> {
	static override type = 'response' as const

	getDefaultProps(): PreviewShape['props'] {
		return {
			html: '',
			w: (960 * 2) / 3,
			h: (1280 * 2) / 3,
		}
	}

	override canEdit = () => true
	override isAspectRatioLocked = () => false
	override canResize = () => true
	override canBind = () => false

	override component(shape: PreviewShape) {
		const isEditing = useIsEditing(shape.id)
		const toast = useToasts()

		const boxShadow = useValue(
			'box shadow',
			() => {
				const rotation = this.editor.getShapePageTransform(shape)!.rotation()
				return getRotatedBoxShadow(rotation)
			},
			[this.editor]
		)

		// Kind of a hack—we're preventing users from pinching-zooming into the iframe
		const htmlToUse = shape.props.html.replace(
			`</body>`,
			`
			 <canvas id="overlayCanvas"></canvas>
			<script src="https://unpkg.com/html2canvas"></script><script>
			// send the screenshot to the parent window
  			window.addEventListener('message', function(event) {
    		if (event.data.action === 'take-screenshot' && event.data.shapeid === "${shape.id}") {
      		html2canvas(document.body, {useCors : true}).then(function(canvas) {
        		const data = canvas.toDataURL('image/png');
        		window.parent.postMessage({screenshot: data, shapeid: "${shape.id}"}, "*");
      		});
    		}
  			}, false);
			document.body.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); return }, { passive: false })</script>
			 <style>
        #overlayCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1000;
            pointer-events: none;
            border: 1px dashed lightgray;
            display: none; /* Hide canvas by default */
        }
        .fix-button {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            z-index: 1001;
        }
        .fix-button:hover {
            background: #0056b3;
        }
        .fix-button.active {
            background: #dc3545;
        }
    </style>
			<script>
        const canvas = document.getElementById('overlayCanvas');
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let startX, startY, endX, endY;
        let isFixMode = false;

        // Add Fix button
        const fixButton = document.createElement('button');
        fixButton.textContent = 'Fix';
        fixButton.className = 'fix-button';
        document.body.appendChild(fixButton);

        fixButton.addEventListener('click', () => {
            isFixMode = !isFixMode;
            canvas.style.display = isFixMode ? 'block' : 'none';
            fixButton.classList.toggle('active');
            fixButton.textContent = isFixMode ? 'Cancel Fix' : 'Fix';
            
            if (!isFixMode) {
                // Clear any existing arrow
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            
            console.log('Fix mode:', isFixMode);
        });

        function resizeCanvas() {
            console.log('Resizing canvas...');
            // Set canvas dimensions to match the entire document size
            const newWidth = Math.max(
                document.documentElement.scrollWidth,
                document.documentElement.clientWidth,
                document.body.scrollWidth
            );
            const newHeight = Math.max(
                document.documentElement.scrollHeight,
                document.documentElement.clientHeight,
                document.body.scrollHeight
            );
            
            console.log('New dimensions:', { width: newWidth, height: newHeight });
            
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            // Position the canvas to cover everything
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '1000';
            canvas.style.pointerEvents = 'none';
            
            console.log('Canvas styles set:', {
                position: canvas.style.position,
                width: canvas.style.width,
                height: canvas.style.height
            });
        }

        function drawArrow(context, fromx, fromy, tox, toy, arrowWidth = 10, color = 'red') {
            const headlen = 15; // length of head in pixels
            const dx = tox - fromx;
            const dy = toy - fromy;
            const angle = Math.atan2(dy, dx);

            context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame

            context.strokeStyle = color;
            context.fillStyle = color;
            context.lineWidth = arrowWidth;

            // Draw line
            context.beginPath();
            context.moveTo(fromx, fromy);
            context.lineTo(tox, toy);
            context.stroke();

            // Draw arrowhead
            context.beginPath();
            context.moveTo(tox, toy);
            context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
            context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
            context.closePath();
            context.fill();
        }

        function getPageCoordinates(event) {
            // Get the canvas's bounding rectangle
            const rect = canvas.getBoundingClientRect();
            // Calculate coordinates relative to the canvas
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }

        // --- Event Listeners ---

        document.addEventListener('mousedown', (e) => {
            if (!isFixMode) return; // Only allow drawing in fix mode
            
            console.log('Mouse down in fix mode');
            // Check if the click is on a button or interactive element
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button, a')) {
                return;
            }

            isDrawing = true;
            const coords = getPageCoordinates(e);
            startX = coords.x;
            startY = coords.y;
            endX = startX;
            endY = startY;
            canvas.style.pointerEvents = 'auto';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            console.log('Draw start:', startX, startY);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isFixMode || !isDrawing) return;
            
            const coords = getPageCoordinates(e);
            endX = coords.x;
            endY = coords.y;
            
            drawArrow(ctx, startX, startY, endX, endY, 3, 'rgba(255, 0, 0, 0.7)');
        });

        document.addEventListener('mouseup', async (e) => {
            if (!isFixMode || !isDrawing) return;
            
            console.log('Ending arrow draw in fix mode');
            isDrawing = false;
            canvas.style.pointerEvents = 'none';

            const coords = getPageCoordinates(e);
            endX = coords.x;
            endY = coords.y;

            // Draw final arrow
            drawArrow(ctx, startX, startY, endX, endY, 4, 'red');

            // Capture screenshot with arrow
            try {
                console.log('Capturing screenshot with arrow...');
                const capturedCanvas = await html2canvas(document.documentElement, {
                    useCORS: true,
                    scrollX: -window.scrollX,
                    scrollY: -window.scrollY,
                    windowWidth: document.documentElement.scrollWidth,
                    windowHeight: document.documentElement.scrollHeight,
                    width: document.documentElement.scrollWidth,
                    height: document.documentElement.scrollHeight,
                    logging: true
                });

                const imageData = capturedCanvas.toDataURL('image/png');
                window.parent.postMessage({
                    action: 'fix-arrow-screenshot',
                    screenshot: imageData,
                    shapeid: "${shape.id}"
                }, "*");

                console.log('Screenshot sent to parent');
                
                // Reset fix mode
                isFixMode = false;
                canvas.style.display = 'none';
                fixButton.classList.remove('active');
                fixButton.textContent = 'Fix';
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
            } catch (error) {
                console.error('Screenshot error:', error);
                alert('Error capturing screenshot');
            }
        });

        // --- Initialization ---
        window.addEventListener('load', resizeCanvas); // Resize on load
        window.addEventListener('resize', () => {
            console.log('Resize event triggered');
            resizeCanvas();
        });
        
        // Initial canvas setup with logging
        console.log('Initial canvas setup');
        resizeCanvas();

    </script>
			
</body>`
		)

		return (
			<HTMLContainer className="tl-embed-container" id={shape.id}>
				{htmlToUse ? (
					<iframe
						id={`iframe-1-${shape.id}`}
						srcDoc={htmlToUse}
						width={toDomPrecision(shape.props.w)}
						height={toDomPrecision(shape.props.h)}
						draggable={false}
						style={{
							pointerEvents: isEditing ? 'auto' : 'none',
							boxShadow,
							border: '1px solid var(--color-panel-contrast)',
							borderRadius: 'var(--radius-2)',
						}}
					/>
				) : (
					<div
						style={{
							width: '100%',
							height: '100%',
							backgroundColor: 'var(--color-muted-2)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							border: '1px solid var(--color-muted-1)',
						}}
					>
						<DefaultSpinner />
					</div>
				)}
				<div
					style={{
						position: 'absolute',
						top: 0,
						right: -40,
						height: 40,
						width: 40,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: 'pointer',
						pointerEvents: 'all',
					}}
					onClick={() => {
						if (navigator && navigator.clipboard) {
							navigator.clipboard.writeText(shape.props.html)
							toast.addToast({
								icon: 'duplicate',
								title: 'Copied to clipboard',
							})
						}
					}}
					onPointerDown={stopEventPropagation}
				>
					<TldrawUiIcon icon="duplicate" />
				</div>
				{htmlToUse && (
					<div
						style={{
							textAlign: 'center',
							position: 'absolute',
							bottom: isEditing ? -40 : 0,
							padding: 4,
							fontFamily: 'inherit',
							fontSize: 12,
							left: 0,
							width: '100%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							pointerEvents: 'none',
						}}
					>
						<span
							style={{
								background: 'var(--color-panel)',
								padding: '4px 12px',
								borderRadius: 99,
								border: '1px solid var(--color-muted-1)',
							}}
						>
							{isEditing ? 'Click the canvas to exit' : 'Double click to interact'}
						</span>
					</div>
				)}
			</HTMLContainer>
		)
	}

	override toSvg(shape: PreviewShape, _ctx: SvgExportContext) {
		// while screenshot is the same as the old one, keep waiting for a new one
		return new Promise<ReactElement>((resolve, reject) => {
			if (window === undefined) {
				reject()
				return
			}

			const windowListener = (event: MessageEvent) => {
				if (event.data.screenshot && event.data?.shapeid === shape.id) {
					window.removeEventListener('message', windowListener)
					clearTimeout(timeOut)

					resolve(<PreviewImage href={event.data.screenshot} shape={shape} />)
				}

				if (event.data.action === 'fix-arrow-screenshot' && event.data?.shapeid === shape.id) {
					window.removeEventListener('message', windowListener)
					clearTimeout(timeOut)

					console.log('fix-arrow-screenshot', event.data)
					resolve(<PreviewImage href={event.data.screenshot} shape={shape} />)
				}
			}
			const timeOut = setTimeout(() => {
				reject()
				window.removeEventListener('message', windowListener)
			}, 2000)
			window.addEventListener('message', windowListener)
			//request new screenshot
			const firstLevelIframe = document.getElementById(`iframe-1-${shape.id}`) as HTMLIFrameElement
			if (firstLevelIframe) {
				firstLevelIframe.contentWindow?.postMessage(
					{ action: 'take-screenshot', shapeid: shape.id },
					'*'
				)
			} else {
				console.error('first level iframe not found or not accessible')
			}
		})
	}

	indicator(shape: PreviewShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
}

function getRotatedBoxShadow(rotation: number) {
	const cssStrings = ROTATING_BOX_SHADOWS.map((shadow) => {
		const { offsetX, offsetY, blur, spread, color } = shadow
		const vec = new Vec(offsetX, offsetY)
		const { x, y } = vec.rot(-rotation)
		return `${x}px ${y}px ${blur}px ${spread}px ${color}`
	})
	return cssStrings.join(', ')
}

function PreviewImage({ shape, href }: { shape: PreviewShape; href: string }) {
	return <image href={href} width={shape.props.w.toString()} height={shape.props.h.toString()} />
}

const ROTATING_BOX_SHADOWS = [
	{
		offsetX: 0,
		offsetY: 2,
		blur: 4,
		spread: -1,
		color: '#0000003a',
	},
	{
		offsetX: 0,
		offsetY: 3,
		blur: 12,
		spread: -2,
		color: '#0000001f',
	},
]
