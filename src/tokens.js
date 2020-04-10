import {ExternalTokenizer} from "lezer"
import {
  bracketedNewline as bracketedNewlineToken, enterBody, leaveBody,
  ParenthesizedExpression, TupleExpression, ComprehensionExpression, ArrayExpression, ArrayComprehensionExpression,
  DictionaryExpression, DictionaryComprehensionExpression, SetExpression, SetComprehensionExpression,
  Body
} from "./parser.terms.js"

const newline = 10, space = 32, tab = 9

const bracketed = [
  ParenthesizedExpression, TupleExpression, ComprehensionExpression, ArrayExpression, ArrayComprehensionExpression,
  DictionaryExpression, DictionaryComprehensionExpression, SetExpression, SetComprehensionExpression
], body = [Body]

export const bracketedNewline = new ExternalTokenizer((input, token, stack) => {
  if (input.get(token.start) == newline && stack.startOf(bracketed) > -1)
    token.accept(bracketedNewlineToken, token.start + 1)
}, {contextual: true})

const maxIndent = 50

// FIXME see if this can be cached/optimized?
function countIndent(input, pos) {
  let before = input.read(Math.max(0, pos - maxIndent), pos)
  let count = 0
  for (let i = Math.max(0, before.lastIndexOf("\n")); i < before.length; i++) {
    let ch = before.charCodeAt(i)
    if (ch == space) count++
    else if (ch == tab) count = 8 - (count % 8)
    else break
  }
  return count
}

export const bodyBounds = new ExternalTokenizer((input, token, stack) => {
  let here = countIndent(input, token.start)
  // FIXME fails for multi-line compound openers
  let parent = stack.startOf(body), parentIndent = parent < 0 ? 0 : countIndent(input, parent)
  if (here < parent) token.accept(leaveBody, input.start)
  else if (here > parent) token.accept(enterBody, input.start)
}, {contextual: true})
