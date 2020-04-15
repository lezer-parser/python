import {ExternalTokenizer} from "lezer"
import {
  newline as newlineToken, eof, newlineEmpty, newlineBracketed, continueBody, endBody,
  ParenthesizedExpression, TupleExpression, ComprehensionExpression, ArrayExpression, ArrayComprehensionExpression,
  DictionaryExpression, DictionaryComprehensionExpression, SetExpression, SetComprehensionExpression,
  compoundStatement,
  printKeyword
} from "./parser.terms.js"

const newline = 10, carriageReturn = 13, space = 32, tab = 9, hash = 35, parenOpen = 40, dot = 46

const bracketed = [
  ParenthesizedExpression, TupleExpression, ComprehensionExpression, ArrayExpression, ArrayComprehensionExpression,
  DictionaryExpression, DictionaryComprehensionExpression, SetExpression, SetComprehensionExpression
], parentStatement = [compoundStatement]

const caches = new WeakMap

// Per-input-stream indentation cache. `prev` maps indentation depths
// to the last position at which a statement indented to that depth
// was seen. There's an extra set of slots for the _current_
// indentation, since that needs to be available alongside a previous
// indentation position at the same level.
class Cache {
  constructor() {
    this.last = this.lastIndent = -1
    this.prev = []
  }

  get(pos) {
    if (this.last == pos) return this.lastIndent
    for (let i = 0; i < this.prev.length; i++) if (this.prev[i] == pos) return i
    return -1
  }

  set(pos, indent) {
    if (pos == this.last) return
    if (this.last > -1) this.setPrev(this.last, this.lastIndent)
    this.last = pos
    this.lastIndent = indent
  }

  setPrev(pos, indent) {
    while (this.prev.length < indent) this.prev.push(-1)
    this.prev[indent] = pos
  }

  static for(input) {
    let found = caches.get(input)
    if (!found) caches.set(input, found = new Cache)
    return found
  }
}

const maxIndent = 50

function getIndent(input, pos) {
  let cache = Cache.for(input), found = cache.get(pos)
  if (found > -1) return found

  // This shouldn't happen very often (or even at all) in normal
  // parsing, since the indentations are stored by the newline
  // tokenizer ahead of time. But it's kind of tricky to prove whether
  // that always happens in incremental parsing scenarios, so here's a
  // fallback anyway.
  let before = input.read(Math.max(0, pos - maxIndent), pos)
  let count = 0, start = before.length
  for (; start > 0; start--) {
    let next = before.charCodeAt(start - 1)
    if (next == newline || next == carriageReturn) break
  }
  for (let i = start; i < before.length; i++) {
    let ch = before.charCodeAt(i)
    if (ch == space) count++
    else if (ch == tab) count += 8 - (count % 8)
    else break
  }
  cache.setPrev(pos, count)
  return count
}

export const newlines = new ExternalTokenizer((input, token, stack) => {
  let next = input.get(token.start)
  if (next < 0) {
    token.accept(eof, token.start)
    return
  }
  if (next != newline && next != carriageReturn) return
  if (stack.startOf(bracketed) > -1) {
    token.accept(newlineBracketed, token.start + 1)
    return
  }
  let scan = token.start + 1, indent = 0
  for (; scan < input.length; scan++) {
    let ch = input.get(scan)
    if (ch == space) indent++
    else if (ch == tab) indent += 8 - (indent % 8)
    else if (ch == newline || indent == carriageReturn || ch == hash) {
      token.accept(newlineEmpty, token.start + 1)
      return
    } else {
      break
    }
  }
  token.accept(newlineToken, token.start + 1)
  Cache.for(input).set(scan, indent)
}, {contextual: true})

export const bodyContinue = new ExternalTokenizer((input, token, stack) => {
  let parent = stack.startOf(parentStatement)
  let parentIndent = parent < 0 ? 0 : getIndent(input, parent)
  let indentHere = getIndent(input, token.start)
  token.accept(indentHere <= parentIndent ? endBody : continueBody, token.start)
}, {contextual: true})

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
