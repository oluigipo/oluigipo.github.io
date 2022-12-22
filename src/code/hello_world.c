#include <stdio.h>
#include <stdbool.h>

enum TestKind { TESTKIND_A, TESTKIND_B, TESTKIND_C };
union TestFields {
	int field_a;
	float32 field_b;
	uint64 field_c;
};
struct Test {
	enum TestKind kind;
	union TestFields fields;
};

int main() {
	printf("Hello, World!\n");

	struct Test my_test = {
		.kind = TESTKIND_C,
		.fields = {
			.field_c = true
		}
	};

	return 0;
}
