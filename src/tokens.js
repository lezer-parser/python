import {ExternalTokenizer, ContextTracker} from "lezer"
import {
  newline as newlineToken, eof, newlineEmpty, newlineBracketed, indent, dedent, printKeyword,
  ParenthesizedExpression, TupleExpression, ComprehensionExpression, ArrayExpression, ArrayComprehensionExpression,
  DictionaryExpression, DictionaryComprehensionExpression, SetExpression, SetComprehensionExpression
} from "./parser.terms.js"

const newline = 10, carriageReturn = 13, space = 32, tab = 9, hash = 35, parenOpen = 40, dot = 46

const bracketed = [
  ParenthesizedExpression, TupleExpression, ComprehensionExpression, ArrayExpression, ArrayComprehensionExpression,
  DictionaryExpression, DictionaryComprehensionExpression, SetExpression, SetComprehensionExpression
]

let cachedIndent = 0, cachedInput = null, cachedPos = 0
function getIndent(input, pos) {
  if (pos == cachedPos && input == cachedInput) return cachedIndent
  cachedInput = input; cachedPos = pos
  return cachedIndent = getIndentInner(input, pos)
}

function getIndentInner(input, pos) {
  for (let indent = 0;; pos++) {
    let ch = input.get(pos)
    if (ch == space) indent++
    else if (ch == tab) indent += 8 - (indent % 8)
    else if (ch == newline || ch == carriageReturn || ch == hash) return -1
    else return indent
  }
}

export const newlines = new ExternalTokenizer((input, token, stack) => {
  let next = input.get(token.start)
  if (next < 0) {
    token.accept(eof, token.start)
  } else if (next != newline && next != carriageReturn) {
  } else if (stack.startOf(bracketed) != null) {
    token.accept(newlineBracketed, token.start + 1)
  } else if (getIndent(input, token.start + 1) < 0) {
    token.accept(newlineEmpty, token.start + 1)
  } else {
    token.accept(newlineToken, token.start + 1)
  }
}, {contextual: true, fallback: true})

export const indentation = new ExternalTokenizer((input, token, stack) => {
  let prev = input.get(token.start - 1), depth
  if ((prev == newline || prev == carriageReturn) &&
      (depth = getIndent(input, token.start)) >= 0 &&
      depth != stack.context.depth &&
      stack.startOf(bracketed) == null)
    token.accept(depth < stack.context.depth ? dedent : indent, token.start)
})

function IndentLevel(parent, depth) {
  this.parent = parent
  this.depth = depth
  this.hash = (parent ? parent.hash + parent.hash << 8 : 0) + depth + (depth << 4)
}

const topIndent = new IndentLevel(null, 0)

export const trackIndent = new ContextTracker({
  start: topIndent,
  shift(context, term, input, stack) {
    return term == indent ? new IndentLevel(context, getIndent(input, stack.pos)) :
      term == dedent ? context.parent : context
  },
  hash(context) { return context.hash }
})

export const legacyPrint = new ExternalTokenizer((input, token) => {
  let pos = token.start
  for (let print = "print", i = 0; i < print.length; i++, pos++)
    if (input.get(pos) != print.charCodeAt(i)) return
  let end = pos
  if (/\w/.test(String.fromCharCode(input.get(pos)))) return
  for (;; pos++) {
    let next = input.get(pos)
    if (next == space || next == tab) continue
    if (next != parenOpen && next != dot && next != newline && next != carriageReturn && next != hash)
      token.accept(printKeyword, end)
    return
  }
})
