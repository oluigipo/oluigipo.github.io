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

			while (++i, c() == 'x' || c() == 'b' || charIsNumber(c()));

			result.push({ kind: "number", value: str.slice(begin, i) });
		}

		if (c() == '"') {
			const begin = i;

			while (++i, c() != '"');
			++i;
			result.push({ kind: "string", value: str.slice(begin, i) });
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
			"_Imaginary", "Noreturn", "_Static_assert", "_Thread_local"
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
			"printf"
		];

		function normalHighlight(line) {
			return tokenize(line).map(token => {
				function withTag(clazz) {
					return `<span class="${clazz}">${token.value}</span>`;
				}

				switch (token.kind) {
					case "number": return withTag("hl-number");
					case "string": return withTag("hl-string");
					case "empty": return token.value;
					case "operator": return withTag("hl-operator");
					case "comment": return withTag("hl-comment");
					case "ident": {
						if (keywords.includes(token.value))
							return withTag("hl-keyword");

						if (types.includes(token.value))
							return withTag("hl-type");

						if (funcs.includes(token.value))
							return withTag("hl-func");

						return token.value;
					}
				}

				return token.value;
			}).join('');
		}

		str = str.replace(/\</g, '&lt;').replace(/\>/, '&gt;');

		let result = "";

		const lines = str.split('\n');
		for (let i = 0; i < lines.length; ++i) {
			const line = lines[i];
			if (line[0] == '#') {
				result += `<span class="hl-preprocessor">${line}</span>\n`;
				continue;
			}

			result += normalHighlight(line) + '\n';
		}

		return result;
	}
};