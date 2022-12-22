import Highlight from "./build_highlight.ts";

const outputDir = "./build/";
const htmls = [
	"index.html",
];

for (const filename of htmls) {
	const contents = readFile("./src/" + filename);
	writeFile(outputDir + filename, await preprocessHtml(contents));
}

const cmd = [ "xcopy.exe", "/s", "/Y", "included", outputDir.split("/").filter(s => s !== "").join("\\") ];
//console.log(cmd);
const status = await Deno.run({ cmd, /*stdout: "inherit", stderr: "inherit"*/ }).status();
//console.log(status);

// ==========================================
// NOTE(ljre): Functions
function readFile(path: string): string {
	return Deno.readTextFileSync(path);
}

function writeFile(path: string, contents: string) {
	const data = new TextEncoder().encode(contents);
	Deno.writeFile(path, data);
}

async function readFileFromUrl(url: string): string {
	// console.log(url);
	const response = await fetch(url);
	if (response.status !== 200) {
		console.error("could not fetch: " + url);
		return "";
	}
	
	return await response.text();
}

async function preprocessHtml(contents: string): string {
	let result = "";
	const lines = contents.split("\n");
	
	for (const line of lines) {
		const trimmedLine = line.trim();
		let raw = trimmedLine.split(" ");
		
		if (raw.length === 0 || raw[0] !== "<PP" || !raw[raw.length-1].endsWith("/>")) {
			result += trimmedLine + "\n";
			continue;
		}
		
		raw = raw.slice(1);
		raw[raw.length-1] = raw[raw.length-1].replace("/>", "");
		
		const parts = parsePreprocParts(raw);
		
		switch (parts.command) {
			case "code": {
				// NOTE(ljre): Load a file, add highlight and writes to result.
				let code: string;
				
				if (parts.path !== undefined)
					code = readFile("./src/" + parts.path);
				else if (parts.url !== undefined)
					code = await readFileFromUrl(parts.url);
				else {
					console.error(`invalid "code" directive: ${trimmedLine}`);
					break;
				}
				
				let lastLinebreak = result.lastIndexOf("\n");
				result = result.slice(0, lastLinebreak);
				
				const lang = parts.lang;
				if (lang !== undefined && hasHighlightFor(lang)) {
					result += Highlight[lang](code).trim();
				} else {
					result += code.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').trim();
				}
			} break;
			
			default: {
				console.error(`unknown preprocessor directive: ${trimmedLine}`);
			} break;
		}
	}
	
	return result;
}

interface Parts {
	command: string;
	tags: string[];
	path?: string;
	url?: string;
	lang?: string;
}

function parsePreprocParts(parts: string[]): Parts {
	let result: Parts = {
		command: parts[0],
		tags: [],
	};
	
	for (const part of parts.slice(1)) {
		const asParam = /(\w+)=(\".*\")/.exec(part);
		
		if (asParam) {
			const name = asParam[1];
			const value = asParam[2].slice(1, asParam[2].length-1);
			
			if (!["path", "url", "lang"].includes(name)) {
				console.error(`Invalid preprocessor directive: ${parts}\n`, asParam);
			} else {
				result[<any>name] = value;
			}
		} else {
			result.tags.push(part);
		}
	}
	
	return result;
}

function hasHighlightFor<T extends string>(name: T): T is keyof typeof Highlight {
	return Highlight[<any>name] !== undefined;
}
