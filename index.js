console.log("I'm not hiring if that's what you're looking for.");

const codes = [
	"#include <stdio.h>\nint main() {\n\t// classic.\n\tprintf(\"Hello, World!\\n\");\n\treturn 0;\n}"
];

window.onload = function() {
	let elements = document.getElementsByTagName("code");
	for (let i = 0; i < elements.length; ++i) {
		const el = elements.item(i);

		el.innerHTML = highlight[el.className.replace("lang-", '')](codes[i]);
		el.style.tabSize = 4;
	}
};