console.log("I'm not hiring if that's what you're looking for.");

function requestFile(url) {
	let request = new XMLHttpRequest();
    request.open("GET", url, false);
    request.send();
    
    return request.responseText;
}

const codes = {
	hello_world:
`#include <stdio.h>

int main() {
	// classic.
	printf("Hello, World!\\n");
	return 0;
}`,
	rdp: requestFile("https://gist.githubusercontent.com/oluigipo/59ab027b79a92993cbd1f376002e0d31/raw/83e491075748cc182663184641974d289886f334/parser.c")
};

window.onload = function() {
	let elements = document.getElementsByTagName("code");
	for (let i = 0; i < elements.length; ++i) {
		const el = elements.item(i);

		el.innerHTML = highlight[el.className.replace("lang-", '')](codes[el.innerText]);
		el.style.tabSize = 4;
	}
};