import * as Common from "./common.ts";
import Highlight from "./build_highlight.ts";

const outputDir = "./build/";
const htmls = {
	"index.html": "index.html",
	"blog.html": "blog/index.html",
};

const blogFiles = readBlogDir();

const blogBaseHtml =
`<!DOCTYPE html>
<!-- I'm not hiring if that's what you are looking for. -->

<head>
	<title>%TITLE%</title>
	<meta charset="UTF-8"/>
	<link rel="shortcut icon" type="image/png" href="/favicon.ico">
	<link rel="stylesheet" href="/index.css">
	<style>
		
	</style>
</head>
<body>
	<div class="column">
		<p><a href="/blog">&lt; Back</a></p>
%CONTENT%
	</div>
</body>
`;

const blogIndex = makeBlogIndex(blogFiles);

// NOTE(ljre): Create all needed folders
createFolder(outputDir);
for (const output of Object.values(htmls)) {
	const last = output.lastIndexOf("/");
	if (last !== -1) {
		const folder = output.slice(0, last);
		createFolder(outputDir + folder);
	}
}

// NOTE(ljre): Preprocess HTML files
for (const filename of Object.keys(htmls)) {
	const contents = readFile("./src/" + filename);
	writeFile(outputDir + htmls[filename], await preprocessHtml(contents));
}

// NOTE(ljre): Write blog entries
for (const entry of blogIndex) {
	const finalContents = blogBaseHtml.replace("%TITLE%", entry.title).replace("%CONTENT%", entry.content);
	writeFile(outputDir + entry.file, finalContents);
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

async function readFileFromUrl(url: string): Promise<string> {
	// console.log(url);
	const response = await fetch(url);
	if (response.status !== 200) {
		console.error("could not fetch: " + url);
		return "";
	}
	
	return await response.text();
}

function createFolder(path: string) {
	Deno.mkdir(path, { recursive: true });
}

function readBlogDir(): string[] {
	let result: string[] = [];
	
	for (const file of Deno.readDirSync("src/blog/")) {
		if (!file.name.startsWith("."))
			result.push(file.name.split('.')[0]);
	}
	
	return result;
}

async function preprocessHtml(contents: string): Promise<string> {
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
				
				result += makeCodeBlock(code, parts.lang);
			} break;
			
			case "blogindex": {
				// NOTE(ljre): Args
				let max = parts.max ? parseInt(parts.max) : -1;
				let count = 0;
				
				// NOTE(ljre): Build table
				let table = "";
				table += "<table class=\"blogindex\">\n";
				
				for (const entry of blogIndex) {
					++count;
					if (count > max && max !== -1)
						break;
					
					table += "<tr>";
					table += `<td style="width:70%"><a href="/${entry.file}">${entry.title}</a></td>`;
					table += `<td>${entry.date}</td>`;
					table += "</tr>\n";
				}
				
				table += "</table>\n";
				result += table;
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
	max?: string;
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

function hasHighlightFor<T extends string>(name: T): boolean {
	return Highlight[<any>name] !== undefined;
}

interface Blog {
	title: string;
	date: string;
	file: string;
	content: string;
}

function makeBlogIndex(files: string[]): Blog[] {
	let result: Blog[] = [];
	
	for (const file of files) {
		const path = `src/blog/${file}.md`;
		const contents = readFile(path);
		
		result.push(parseBlogEntry(contents, file));
	}
	
	result.sort((a, b) => {
		let atime = a.date.split('-').map(v => parseInt(v));
		let btime = b.date.split('-').map(v => parseInt(v));
		
		let acmp = atime[0]*1000*1000 + atime[1]*1000 + atime[2];
		let bcmp = btime[0]*1000*1000 + btime[1]*1000 + btime[2];
		
		return Math.sign(bcmp - acmp);
	});
	
	return result;
}

function parseBlogEntry(rawContent: string, baseName: string): Blog {
	let result: Blog = {
		title: "",
		date: "",
		file: "blog/" + baseName + ".html",
		content: "",
	};
	
	const rawLines = rawContent.split('\n');
	const validMetadata = Object.keys(result);
	
	let buildingParagraph = "";
	
	function flushParagraph() {
		if (buildingParagraph.trim() !== "") {
			const str = buildingParagraph;
			result.content += "<p>" + str + "</p>";
		}
		
		buildingParagraph = "";
	}
	
	for (let i = 0; i < rawLines.length; ++i) {
		let line = rawLines[i];
		
		// NOTE(ljre): Parse metadata
		if (line.startsWith("@@")) {
			const rawMetadata = line.slice(2).split(' ');
			const name = rawMetadata[0];
			const value = rawMetadata.slice(1).join(' ');
			
			if (validMetadata.includes(name)) {
				result[name] = value;
			}
			
			continue;
		}
		
		// NOTE(ljre): Parse content
		if (line === "") {
			flushParagraph();
			continue;
		}
		
		if (line.startsWith("# ")) {
			flushParagraph();
			
			const value = Common.sanitizeRawTextForHtml(line.slice(2));
			result.content += "<h1>" + value + "</h1>";
			
			continue;
		}
		
		if (line.startsWith("* ")) {
			flushParagraph();
			result.content += "<ul>";
			
			do {
				const value = processSimpleParagraph(line.slice(2));
				result.content += "<li>" + value + "</li>";
				
				line = rawLines[++i];
			} while (line !== undefined && line.startsWith("* "));
			
			result.content += "</ul>";
			continue;
		}
		
		if (line.startsWith("```")) {
			flushParagraph();
			
			const lang = line.slice(3) || undefined;
			let code = "";
			
			while (line = rawLines[++i], line !== undefined) {
				if (line.startsWith("```"))
					break;
				
				code += Common.sanitizeRawTextForHtml(line) + "\n";
			}
			
			result.content += makeCodeBlock(code, lang);
			continue;
		}
		
		buildingParagraph += processSimpleParagraph(line) + " ";
	}
	
	flushParagraph();
	
	return result;
}

function processSimpleParagraph(str: string): string {
	let result = Common.sanitizeRawTextForHtml(str);
	
	const italicRegex = /\*(\\\*|[^\*])+\*/g;
	const inlinecodeRegex = /`((\\`)|[^`])+`/g;
	const inlineurlRegex = /\[((?:[^\]]+))\]\(((?:[^\)]+))\)/g;
	
	let match: MatchResult | null;
	let hadAnyMatch = false;
	
	while (match = italicRegex.exec(result)) {
		const rawMatch = match[0];
		if (rawMatch.match(/[^\\]\`/g))
			continue;
		
		const replacement = "<i>" + rawMatch.slice(1, rawMatch.length-1) + "</i>";
		
		result = result.replace(rawMatch, replacement);
		hadAnyMatch = true;
	}
	
	while (match = inlinecodeRegex.exec(result)) {
		const rawMatch = match[0];
		const replacement = "<code class=\"inlinecode\">" + rawMatch.slice(1, rawMatch.length-1) + "</code>";
		
		result = result.replace(rawMatch, replacement);
		hadAnyMatch = true;
	}
	
	while (match = inlineurlRegex.exec(result)) {
		const rawMatch = match[0];
		const text = match[1];
		const url = match[2];
		const replacement = `<a href="${url}">` + text + "</a>";
		
		result = result.replace(rawMatch, replacement);
		hadAnyMatch = true;
	}
	
	return result;
}

function makeCodeBlock(code: string, lang?: string): string {
	if (lang !== undefined && hasHighlightFor(lang)) {
		code = Highlight[lang](code);
	} else {
		code = code;
	}
	
	return "<code class=\"codeblock\">" + code.trim() + "</code>";
}
