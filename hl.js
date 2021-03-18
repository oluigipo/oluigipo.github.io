/**
	@param str {string}
	@returns {string}
*/
function giveABath(str) {
	return str.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
}

/**
	@param c {string}
	@returns {boolean}
*/
function charIsLetter(c) {
	return c == '_' || (c.toUpperCase().charCodeAt(0) >= 65 && c.toUpperCase().charCodeAt(0) <= 90);
}

/**
	@param c {string}
	@returns {boolean}
*/
function charIsNumber(c) {
	return (c.charCodeAt(0) >= 48 && c.charCodeAt(0) <= 57)
}

/**
	@param str {string}
	@returns {{kind:string,value:string}[]}
*/
function tokenize(str) {
	let result = [];

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
			case ' ': case '\t': case '{': case '}': case ';': case ':':
				result.push({ kind: "empty", value: c() });
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


const highlight = {
	/**
		@param str {string}
	*/
	c: function(str) {
		const keywords = [
			"if", "while", "do", "return", "for", "static", "extern",
			"const", "restrict", "unsigned", "signed", "auto",
			"break", "case", "continue", "default", "else",
			"enum", "extern", "fortran", "goto", "inline",
			"long", "short", "register", "return", "sizeof",
			"struct", "switch", "typedef", "union", "_Alignas",
			"_Alignof", "_Atomic", "_Bool", "_Complex", "Generic",
			"_Imaginary", "Noreturn", "_Static_assert", "_Thread_local",

			// my things
			"internal", "global"
		];

		const types = [
			"int", "uint", "char",
			"u8", "u16", "u32", "u64",
			"i8", "i16", "i32", "i64",
			"b8", "b16", "b32", "b64",
			"float", "f32", "double", "f64",
			"char", "void", "bool"
		];

		const funcs = [
			//"printf", "getchar"
		];

		let scopeCount = 0;

		function normalHighlight(line) {
			if (line == "")
				return line;

			let tokens = tokenize(line);
			for (let i = 0; i < tokens.length; ++i) {
				const token = tokens[i];

				function withTag(clazz) {
					return `<span class="${clazz}">${giveABath(token.value)}</span>`;
				}

				switch (token.kind) {
					case "number": tokens[i] = withTag("hl-number"); break;
					case "string": tokens[i] = withTag("hl-string"); break;
					case "operator": tokens[i] = withTag("hl-operator"); break;
					case "comment": tokens[i] = withTag("hl-comment"); break;
					case "empty": {
						if (token.value == '{')
							++scopeCount;
						else if (token.value == '}')
							--scopeCount;

						tokens[i] = token.value;
					} break;
					case "ident": {
						if (tokens[i+1]?.value == '(')
							funcs.push(token.value);

						if (keywords.includes(token.value))
							tokens[i] = withTag("hl-keyword");
						else if (types.includes(token.value))
							tokens[i] = withTag("hl-type");
						else if (funcs.includes(token.value))
							tokens[i] = withTag("hl-func");
						else tokens[i] = token.value;
					} break;
					default: tokens[i] = token.value; break; 
				}
			}

			return tokens.join('');
		}

		let result = "";

		const lines = str.split('\n');
		for (let i = 0; i < lines.length; ++i) {
			let line = lines[i];
			if (line[0] == '#') {
				line = giveABath(line);
				result += `<span class="hl-preprocessor">${line}</span>\n`;
				continue;
			}

			result += normalHighlight(line) + '\n';
		}

		return result;
	}
};