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
	TLShape,
	toDomPrecision,
	useIsEditing,
	useToasts,
	useValue,
	Vec,
} from 'tldraw'
import Image from 'next/image'
import React from 'react'

export type PreviewShape = TLBaseShape<
	'response',
	{
		html: string
		w: number
		h: number
		image: {
			dataUrl: string
			width: number
			height: number
		}
	}
>

// Global resolvers map to handle screenshot messages
const screenshotResolvers = new Map<
	string,
	{ resolve: (element: ReactElement) => void; reject: () => void }
>()

export class PreviewShapeUtil extends BaseBoxShapeUtil<PreviewShape> {
	static override type = 'response' as const

	getDefaultProps(): PreviewShape['props'] {
		return {
			html: '',
			w: (960 * 2) / 3,
			h: (1280 * 2) / 3,
			image: {
				dataUrl: '',
				width: 0,
				height: 0,
			},
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

		const spinner = () => {
			if (!!shape.props.image) {
				return (
					<div
						style={{
							width: '100%',
							height: '100%',
							position: 'relative',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							// Even Thicker, glass-like border
							borderWidth: '6px',
							borderStyle: 'solid',
							borderColor: 'rgba(255, 255, 255, 0.4)', // More opaque border color
							// Increased border radius
							borderRadius: '24px',
							// Outer shadow + thicker inner shadow for glass edge effect
							boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1), inset 0 0 0 2px rgba(255, 255, 255, 0.2)',
							overflow: 'hidden',
							backgroundColor: 'var(--color-muted-2)',
							pointerEvents: 'none',
						}}
					>
						<Image
							src={shape.props.image.dataUrl}
							alt="Selected shapes"
							width={shape.props.image.width}
							height={shape.props.image.height}
							style={{
								display: 'block',
								maxWidth: '100%',
								maxHeight: '100%',
								objectFit: 'contain',
							}}
						/>
						{/* Overlay for Glass Effect */}
						<div
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								// Initial background color (will be overridden by animation)
								backgroundColor: 'hsla(0, 75%, 80%, 0.15)',
								// Initial backdrop filter (will be overridden by animation)
								backdropFilter: 'blur(2px)',
								WebkitBackdropFilter: 'blur(2px)',
								pointerEvents: 'none',
								// Apply both animations, comma-separated
								animation: 'pulseBlur 3s infinite ease-in-out, cycleColor 10s infinite linear',
							}}
						/>
					</div>
				)
			}

			return <DefaultSpinner />
		}

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
        /* Custom modal styles */
        .fix-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            display: none;
        }
        .fix-modal {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            width: 80%;
            max-width: 500px;
        }
        .fix-modal h3 {
            margin-top: 0;
            color: #333;
        }
        .fix-modal textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 10px 0;
            height: 100px;
            resize: vertical;
        }
        .fix-modal-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        .fix-modal-buttons button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .fix-modal-cancel {
            background: #f2f2f2;
            color: #333;
        }
        .fix-modal-submit {
            background: #007bff;
            color: white;
        }
        .fix-modal-submit:hover {
            background: #0056b3;
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

        // For storing user's issue description
        let userIssueMessage = '';
        
        // Create modal elements
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fix-modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'fix-modal';
        
        modalContent.innerHTML = 
            '<h3>Describe the Issue</h3>' +
            '<p>Please describe the issue that needs fixing:</p>' +
            '<textarea id="issue-description" placeholder="Enter issue description here..."></textarea>' +
            '<div class="fix-modal-buttons">' +
                '<button class="fix-modal-cancel">Cancel</button>' +
                '<button class="fix-modal-submit">OK</button>' +
            '</div>';
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Get modal elements
        const submitBtn = modalContent.querySelector('.fix-modal-submit');
        const cancelBtn = modalContent.querySelector('.fix-modal-cancel');
        const textarea = modalContent.querySelector('#issue-description');

        fixButton.addEventListener('click', () => {
            if (!isFixMode) {
                // Show modal instead of browser prompt
                modalOverlay.style.display = 'flex';
                textarea.value = ''; // Clear previous input
                textarea.focus();
            } else {
                // Cancel fix mode
                isFixMode = false;
                canvas.style.display = 'none';
                fixButton.classList.remove('active');
                fixButton.textContent = 'Fix';
                userIssueMessage = '';
                
                // Clear any existing arrow
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });
        
        // Modal submit button
        submitBtn.addEventListener('click', () => {
            userIssueMessage = textarea.value.trim();
            if (userIssueMessage) {
                modalOverlay.style.display = 'none';
                isFixMode = true;
                canvas.style.display = 'block';
                fixButton.classList.add('active');
                fixButton.textContent = 'Cancel Fix';
                console.log('Fix mode activated with message:', userIssueMessage);
            } else {
                alert('Please enter a description of the issue');
            }
        });
        
        // Modal cancel button
        cancelBtn.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
        
        // Close modal when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
            }
        });

        function resizeCanvas() {
            console.log('Resizing canvas...');
            
            // Set canvas dimensions to match the viewport
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Position the canvas to cover everything in the viewport
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '1000';
            canvas.style.pointerEvents = 'none';
            
            console.log('Canvas dimensions set to viewport:', {
                width: canvas.width,
                height: canvas.height
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
            
            // Draw issue message near arrow tip if available
            if (userIssueMessage) {
                context.font = '14px Arial';
                context.fillStyle = 'black';
                context.strokeStyle = 'white';
                context.lineWidth = 3;
                
                // Position the text near the arrow tip
                const textX = tox + 15;
                const textY = toy;
                
                // Create background for text
                const metrics = context.measureText(userIssueMessage);
                const textHeight = 18; // Approximate height of the text
                
                context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                context.fillRect(
                    textX - 5, 
                    textY - textHeight + 5, 
                    metrics.width + 10, 
                    textHeight + 10
                );
                
                // Draw the text
                context.fillStyle = 'black';
                context.fillText(userIssueMessage, textX, textY);
            }
        }

        function getPageCoordinates(event) {
            // For fixed position canvas that covers the viewport,
            // we just need the client coordinates
            return {
                x: event.clientX,
                y: event.clientY
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

            // Make sure canvas is visible during capture
            canvas.style.display = 'block';

            // Convert viewport coordinates to document coordinates for the arrow
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            // Store the arrow data with adjusted coordinates
            const arrowData = {
                fromX: startX + scrollX,
                fromY: startY + scrollY,
                toX: endX + scrollX,
                toY: endY + scrollY,
                message: userIssueMessage
            };

            // Delay the screenshot capture to ensure the arrow is rendered
            setTimeout(async () => {
                try {
                    console.log('Capturing screenshot with arrow...');
                    
                    const capturedCanvas = await html2canvas(document.documentElement, {
                        useCORS: true,
                        allowTaint: true,
                        ignoreElements: (element) => {
                            // Ignore the fix button itself
                            return element === fixButton;
                        },
                        backgroundColor: null,
                        logging: true
                    });

                    const imageData = capturedCanvas.toDataURL('image/png');
                    window.parent.postMessage({
                        action: 'fix-arrow-screenshot',
                        screenshot: imageData,
                        shapeid: "${shape.id}",
                        issueMessage: userIssueMessage,
                        previousHtml: document.documentElement.outerHTML,
                        arrowData: arrowData
                    }, "*");

                    console.log('Screenshot sent to parent');
                    
                    // Only reset fix mode AFTER the screenshot is captured and sent
                    setTimeout(() => {
                        isFixMode = false;
                        canvas.style.display = 'none';
                        fixButton.classList.remove('active');
                        fixButton.textContent = 'Fix';
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }, 100); // Small delay to ensure message is sent

                } catch (error) {
                    console.error('Screenshot error:', error);
                    alert('Error capturing screenshot');
                    
                    // Reset fix mode even if there's an error
                    isFixMode = false;
                    canvas.style.display = 'none';
                    fixButton.classList.remove('active');
                    fixButton.textContent = 'Fix';
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }, 50); // Add a small delay before capturing to ensure arrow is rendered
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

		// Define the keyframes animations
		const animations = `
			@keyframes pulseBlur {
				0% { backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); }
				50% { backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
				100% { backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); }
			}

			@keyframes cycleColor {
				0%   { background-color: hsla(0, 75%, 80%, 0.15); }
				25%  { background-color: hsla(90, 75%, 80%, 0.2); }
				50%  { background-color: hsla(180, 75%, 80%, 0.15); }
				75%  { background-color: hsla(270, 75%, 80%, 0.2); }
				100% { background-color: hsla(360, 75%, 80%, 0.15); }
			}
		`

		return (
			<HTMLContainer className="tl-embed-container" id={shape.id}>
				{/* Inject the keyframes styles */}
				<style>{animations}</style>
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
					spinner()
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
		// Use the global resolvers map instead of a local listener
		return new Promise<ReactElement>((resolve, reject) => {
			if (window === undefined) {
				reject()
				return
			}

			console.log('toSvg', shape.id)
			// Store the resolver in the global map
			screenshotResolvers.set(shape.id, { resolve, reject })

			// Set a longer timeout (30 seconds) to allow time for user interaction
			const timeOut = setTimeout(() => {
				console.log('Screenshot timeout for shape:', shape.id)
				screenshotResolvers.delete(shape.id)
				reject()
			}, 30000) // 30 second timeout

			// Request a new screenshot
			const firstLevelIframe = document.getElementById(`iframe-1-${shape.id}`) as HTMLIFrameElement
			if (firstLevelIframe) {
				firstLevelIframe.contentWindow?.postMessage(
					{ action: 'take-screenshot', shapeid: shape.id },
					'*'
				)
			} else {
				console.error('first level iframe not found or not accessible')
				screenshotResolvers.delete(shape.id)
				clearTimeout(timeOut)
				reject()
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
