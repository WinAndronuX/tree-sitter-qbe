# tree-sitter-qbe

[Tree-sitter](https://tree-sitter.github.io/) grammar for the [QBE](https://c9x.me/compile/) Intermediate Language (IL).

## Features

- Complete coverage of QBE Intermediate Language specification:
  - Data definitions (`data $name = { ... }`)
  - Type definitions and aggregate/union types (`type :name = { ... }`)
  - Function definitions (`export function ...`)
  - Linkage flags (`export`, `thread`, `common`, `section`)
  - Block labels (`@start`, `@loop`, etc.)
  - SSA phi instructions (`phi`)
  - Arithmetic, Bitwise, Comparison, Memory, Conversion, and Jump instructions
  - Typed values, constants, floats (`s_...`, `d_...`), and string literals
  - Comments (`# ...`)
- Syntax highlighting queries included in `queries/highlights.scm`.
- Verified against the official QBE test suite.

## Development

```bash
# Generate the C parser
tree-sitter generate

# Parse a QBE IL file
tree-sitter parse example.ssa

# Highlight a file
tree-sitter highlight example.ssa
```

## License

MIT
