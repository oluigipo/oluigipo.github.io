export function sanitizeRawTextForHtml(str: string): string {
	return (str
		.trim()
		.replace(/\&/g, "&amp;")
		.replace(/\</g, "&lt;")
		.replace(/\>/g, "&gt;"));
}