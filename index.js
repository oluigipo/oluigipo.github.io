console.log("I'm not hiring if that's what you're looking for.");

const codes = [
	"#include <stdio.h>\nint main() {\n\tprintf(\"Hello, World!\\n\");\n}"
];

window.onload = function() {
	let elements = document.getElementsByTagName("code");
	for (let i = 0; i < elements.length; ++i) {
		const el = elements.item(i);

		el.innerText = codes[i];
		el.style.tabSize = 4;
	}
}