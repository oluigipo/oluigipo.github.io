import * as Common from "./common.ts";

function charIsLetter(c: string): boolean {
	c = c.toUpperCase();
	
	return c == '_' || (c >= 'A' && c <= 'Z');
}

function charIsNumber(c: string): boolean {
	return (c >= '0' && c <= '9');
}

export default {
	c: function(str: string): string {
		interface Token {
			kind: string;
			value: string;
		}
		
		function tokenize(str: string): Token[] {
			let result: Token[] = [];

			let i = 0;
			do {
				function c(n = 0) {
					return str[i+n] || '\0';
				}

				if (charIsLetter(c())) {
					const begin = i;

					while (++i, charIsLetter(c()) || charIsNumber(c()));

					result.push({ kind: "ident", value: str.slice(begin, i) });
					continue;
				}

				if (charIsNumber(c())) {
					const begin = i;

					while (++i, c() == 'x' || c() == 'b' || c().toLowerCase() == 'f' || charIsNumber(c()));

					result.push({ kind: "number", value: str.slice(begin, i) });
				}

				if (c() == '"' || c() == '\'') {
					const begin = i;
					const close = c();

					while (++i, c() != close);
					++i;
					result.push({ kind: "string", value: str.slice(begin, i) });
					continue;
				}

				if (c() == '/' && c(1) == '/') {
					result.push({ kind: "comment", value: str.slice(i) });
					break;
				}

				switch (c()) {
					case ' ': case '\t':
						result.push({ kind: "empty", value: c() });
						++i;
						break;
					case '{': case '}': case ';': case ':': case ',': case '(': case ')': case '[': case ']':
						result.push({ kind: "control", value: c() });
						++i;
						break;
					default:
						result.push({ kind: "operator", value: c() });
						++i;
						break;
				}
			} while (i < str.length);

			return result;
		}

		const keywords = [
			"if", "while", "do", "return", "for", "static", "extern",
			"const", "restrict", "unsigned", "signed", "auto",
			"break", "case", "continue", "default", "else",
			"enum", "extern", "fortran", "goto", "inline",
			"long", "short", "register", "return", "sizeof",
			"struct", "switch", "typedef", "union", "_Alignas",
			"_Alignof", "_Atomic", "_Bool", "_Complex", "Generic",
			"_Imaginary", "Noreturn", "_Static_assert", "_Thread_local",
			"int", "char", "float", "double", "void",

			// my things
			"internal", "global"
		];

		const types = [
			"uint", "String",
			"u8", "u16", "u32", "u64", "uint8", "uint16", "uint32", "uint64",
			"i8", "i16", "i32", "i64", "int8", "int16", "int32", "int64",
			"b8", "b16", "b32", "b64",
			"f32", "f64", "float32", "float64",
			"bool"
		];

		const funcs = [
			// All the functions are going to be detected automatically.
			//"printf", "getchar"
		];

		const constants = [
			"NULL", "true", "false"
		];

		let scopeCount = 0;
		let enumDecl = false;

		function normalHighlight(line) {
			if (line == "")
				return line;

			let tokens = tokenize(line);
			let result: string[] = [];

			for (let i = 0; i < tokens.length; ++i) {
				const token = tokens[i];

				function withTag(clazz) {
					return `<span class="${clazz}">${Common.sanitizeRawTextForHtml(token.value)}</span>`;
				}

				function previousRelevant() {
					for (let j = i-1; j >= 0; --j) {
						if (tokens[j].kind != "empty")
							return tokens[j];
					}

					return undefined;
				}

				function nextRelevant() {
					for (let j = i+1; j <= tokens.length; ++j) {
						if (tokens[j].kind != "empty")
							return tokens[j];
					}

					return undefined;
				}

				switch (token.kind) {
					case "number": result[i] = withTag("hl-number"); break;
					case "string": result[i] = withTag("hl-string"); break;
					case "operator": result[i] = withTag("hl-operator"); break;
					case "comment": result[i] = withTag("hl-comment"); break;
					case "empty": result[i] = token.value; break;
					case "control": {
						result[i] = token.value;

						if (token.value == '{')
							++scopeCount;
						else if (token.value == '}') {
							--scopeCount;
							enumDecl = false;
						}
					} break;
					case "ident": {
						let previous = previousRelevant()?.value;

						if (["struct", "union", "enum"].includes(previous)) {
							types.push(token.value);

							if (previous == "enum" && nextRelevant()?.value == '{')
								enumDecl = true;
						} else if (enumDecl)
							constants.push(token.value);

						if (tokens[i+1]?.value == '(')
							funcs.push(token.value);

						if (keywords.includes(token.value))
							result[i] = withTag("hl-keyword");
						else if (types.includes(token.value))
							result[i] = withTag("hl-type");
						else if (funcs.includes(token.value))
							result[i] = withTag("hl-func");
						else if (constants.includes(token.value))
							result[i] = withTag("hl-number");
						else {
							result[i] = token.value;
						}
					} break;
					default: result[i] = token.value; break; 
				}
			}

			return result.join('');
		}

		let result = "";

		const lines = str.split('\n');
		for (let i = 0; i < lines.length; ++i) {
			let line = lines[i];
			if (line[0] == '#') {
				line = Common.sanitizeRawTextForHtml(line);
				result += `<span class="hl-preprocessor">${line}</span>\n`;
				continue;
			}

			result += normalHighlight(line) + '\n';
		}

		return result;
	}
};
