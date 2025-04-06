import { registerOTel } from '@vercel/otel'
import { LangfuseExporter } from 'langfuse-vercel'

export function register() {
	registerOTel({
		serviceName: 'langfuse-vercel-ai-example',
		traceExporter: new LangfuseExporter(),
	})
}
