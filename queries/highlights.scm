; Keywords
[
  "function"
  "data"
  "type"
  "align"
  "env"
  "dbgfile"
] @keyword

; Linkage
(linkage) @keyword

; Types
(base_type) @type.builtin
(subword_type) @type.builtin
(extended_type) @type.builtin
(data_field "z" @type.builtin)
(type_identifier) @type

; Function definitions and calls
(function_definition
  name: (global_identifier) @function)

(call_instruction
  "call" @keyword
  target: (_) @function)

; Instructions
(instruction_op) @function

(phi_instruction
  "phi" @keyword)

(jump_instruction
  [
    "jmp"
    "jnz"
    "ret"
    "hlt"
  ] @keyword)

(dbgloc_instruction
  "dbgloc" @keyword)

; Identifiers
(temporary_identifier) @variable
(global_identifier) @constant
(label_identifier) @label

; Parameters
(parameter
  name: (temporary_identifier) @variable.parameter)

; Literals
(string) @string
(number) @number
(float) @number

; Comments
(comment) @comment

; Operators and Punctuation
[
  "="
  "+"
  "..."
] @operator

[
  "("
  ")"
  "{"
  "}"
] @punctuation.bracket

[
  ","
] @punctuation.delimiter
