/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

module.exports = grammar({
  name: 'qbe',

  extras: $ => [
    /[ \t\r\n]/,
    $.comment,
  ],

  conflicts: $ => [
    [$.jump_instruction],
  ],

  word: $ => $._word,

  rules: {
    source_file: $ => repeat($._top_level_item),

    _top_level_item: $ => choice(
      $.type_definition,
      $.data_definition,
      $.function_definition,
      $.dbgfile_directive,
    ),

    comment: $ => /#[^\n]*/,

    dbgfile_directive: $ => seq(
      'dbgfile',
      field('path', $.string),
    ),

    // Linkage flags: export, thread, common, section "name" ["flags"]
    linkage: $ => choice(
      'export',
      'thread',
      'common',
      seq('section', field('name', $.string), optional(field('flags', $.string))),
    ),

    // -------------------------------------------------------------
    // Type definitions
    // -------------------------------------------------------------
    type_definition: $ => seq(
      'type',
      field('name', $.type_identifier),
      '=',
      optional(seq('align', field('align', $.number))),
      '{',
      choice(
        // regular or opaque
        commaSep1($.type_field),
        // union
        repeat1($.type_union_member),
      ),
      optional(','),
      '}',
    ),

    type_union_member: $ => seq(
      '{',
      commaSep1($.type_field),
      optional(','),
      '}',
    ),

    type_field: $ => choice(
      // opaque type size e.g. { 32 }
      $.number,
      // typed field with optional array count e.g. w 10 or :sub 2
      seq(
        field('type', choice($.extended_type, $.type_identifier)),
        optional(field('count', $.number)),
      ),
    ),

    // -------------------------------------------------------------
    // Data definitions
    // -------------------------------------------------------------
    data_definition: $ => seq(
      repeat($.linkage),
      'data',
      field('name', $.global_identifier),
      '=',
      optional(seq('align', field('align', $.number))),
      '{',
      optional(commaSep1($.data_field)),
      optional(','),
      '}',
    ),

    data_field: $ => choice(
      seq('z', field('count', $.number)),
      seq(
        field('type', $.extended_type),
        repeat1($.data_item),
      ),
    ),

    data_item: $ => choice(
      seq(
        field('symbol', $.global_identifier),
        optional(seq('+', field('offset', $.number))),
      ),
      $.string,
      $.number,
      $.float,
    ),

    // -------------------------------------------------------------
    // Function definitions
    // -------------------------------------------------------------
    function_definition: $ => seq(
      repeat($.linkage),
      'function',
      optional(field('return_type', $.abi_type)),
      field('name', $.global_identifier),
      '(',
      optional(commaSep1($.parameter)),
      ')',
      '{',
      repeat($._function_item),
      '}',
    ),

    parameter: $ => choice(
      seq('env', field('name', $.temporary_identifier)),
      seq(field('type', $.abi_type), field('name', $.temporary_identifier)),
      '...',
    ),

    _function_item: $ => choice(
      $.label,
      $.phi_instruction,
      $.call_instruction,
      $.jump_instruction,
      $.regular_instruction,
      $.dbgloc_instruction,
    ),

    label: $ => seq(field('name', $.label_identifier)),

    // %res =w phi @lbl1 %val1, @lbl2 %val2
    phi_instruction: $ => seq(
      field('lhs', $.temporary_identifier),
      '=',
      field('type', $.base_type),
      'phi',
      commaSep1($.phi_branch),
    ),

    phi_branch: $ => seq(
      field('label', $.label_identifier),
      field('val', $.val),
    ),

    // %res =w call $func(...) or call $func(...)
    call_instruction: $ => seq(
      optional(seq(
        field('lhs', $.temporary_identifier),
        '=',
        field('type', $.abi_type),
      )),
      'call',
      field('target', $.val),
      '(',
      optional(commaSep1($.call_arg)),
      ')',
    ),

    call_arg: $ => choice(
      seq('env', $.val),
      seq(field('type', $.abi_type), $.val),
      '...',
    ),

    // Jump instructions: jmp, jnz, ret, hlt
    jump_instruction: $ => choice(
      seq('jmp', field('target', $.label_identifier)),
      seq(
        'jnz',
        field('condition', $.val),
        ',',
        field('if_true', $.label_identifier),
        ',',
        field('if_false', $.label_identifier),
      ),
      seq('ret', optional(field('val', $.val))),
      'hlt',
    ),

    dbgloc_instruction: $ => seq(
      'dbgloc',
      field('line', $.number),
      ',',
      field('col', $.number),
    ),

    // Regular instructions: %res =w add %a, %b or storew %a, %b
    regular_instruction: $ => seq(
      optional(seq(
        field('lhs', $.temporary_identifier),
        '=',
        field('type', $.base_type),
      )),
      field('op', $.instruction_op),
      commaSep1($.val),
    ),

    instruction_op: $ => choice(
      // Arithmetic and Bits
      'add', 'sub', 'neg', 'div', 'rem', 'udiv', 'urem', 'mul',
      'and', 'or', 'xor', 'sar', 'shr', 'shl',
      // Comparisons
      'ceqw', 'cnew', 'csgew', 'csgtw', 'cslew', 'csltw', 'cugew', 'cugtw', 'culew', 'cultw',
      'ceql', 'cnel', 'csgel', 'csgtl', 'cslel', 'csltl', 'cugel', 'cugtl', 'culel', 'cultl',
      'ceqs', 'cges', 'cgts', 'cles', 'clts', 'cnes', 'cos', 'cuos',
      'ceqd', 'cged', 'cgtd', 'cled', 'cltd', 'cned', 'cod', 'cuod',
      // Memory
      'storeb', 'storeh', 'storew', 'storel', 'stores', 'stored',
      'loadsb', 'loadub', 'loadsh', 'loaduh', 'loadsw', 'loaduw', 'load',
      'loadw', 'loadl', 'loads', 'loadd',
      'alloc4', 'alloc8', 'alloc16', 'alloc1', 'alloc2', 'blit',
      // Conversions
      'extsb', 'extub', 'extsh', 'extuh', 'extsw', 'extuw',
      'exts', 'truncd', 'stosi', 'stoui', 'dtosi', 'dtoui',
      'swtof', 'uwtof', 'sltof', 'ultof',
      // Cast and Copy
      'cast', 'copy',
      // Variadic
      'vaarg', 'vastart',
    ),

    // -------------------------------------------------------------
    // Values and Types
    // -------------------------------------------------------------
    val: $ => choice(
      $.temporary_identifier,
      $.constant,
    ),

    constant: $ => choice(
      $.number,
      $.float,
      seq(
        optional('extern'),
        optional('thread'),
        $.global_identifier,
      ),
    ),

    base_type: $ => choice('w', 'l', 's', 'd'),
    subword_type: $ => choice('sb', 'ub', 'sh', 'uh'),
    extended_type: $ => choice('w', 'l', 's', 'd', 'b', 'h'),

    abi_type: $ => choice(
      $.base_type,
      $.subword_type,
      $.type_identifier,
    ),

    // -------------------------------------------------------------
    // Identifiers and Literals
    // -------------------------------------------------------------
    temporary_identifier: $ => token(/%[a-zA-Z._][a-zA-Z0-9$._]*/),
    global_identifier: $ => token(/\$([a-zA-Z._][a-zA-Z0-9$._]*|"[^"\\]*(\\.[^"\\]*)*")/),
    label_identifier: $ => token(/@[a-zA-Z._][a-zA-Z0-9$._]*/),
    type_identifier: $ => token(/:[a-zA-Z._][a-zA-Z0-9$._]*/),

    number: $ => token(/-?[0-9]+/),
    float: $ => token(/(s_|d_)-?[0-9]+(\.[0-9]*)?([eE][+-]?[0-9]+)?/),
    string: $ => token(/"[^"\\]*(\\.[^"\\]*)*"/),

    _word: $ => /[a-zA-Z0-9_]+/,
  },
});
