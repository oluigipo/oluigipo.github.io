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
		const c = () => str[i] || '\0';

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
			result.push({ kind: "string", value: str.slice(begin, i) });
		}

		switch (c()) {
			case ' ': case '\t':
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
			"const", "restrict", "unsigned", "signed"
		];

		const types = [
			"int", "uint", "char",
			"u8", "u16", "u32", "u64",
			"i8", "i16", "i32", "i64"
		];

		function normalHighlight(line) {
			return tokenize(line).map(token => {
				switch (token.kind) {
					case "number":
						return `<span class="hl-number">${token.value}</span>`;
					case "ident":
						if (keywords.includes(token.value))
							return `<span class="hl-keyword">${token.value}</span>`;
						if (types.includes(token.value))
							return `<span class="hl-type">${token.value}</span>`;
						return token.value;
					case "string":
						return `<span class="hl-string">${token.value}</span>`;
					case "empty":
						return token.value;
					case "operator":
						return `<span class="hl-operator">${token.value}</span>`;
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