## 0.15.0 (2021-08-11)

### Breaking changes

The module's name changed from `lezer-python` to `@lezer/python`.

Upgrade to the 0.15.0 lezer interfaces.

## 0.13.7 (2021-07-12)

### Bug fixes

Fix a bug that caused newlines to be disallowed in argument and parameter lists.

## 0.13.6 (2021-02-17)

### Bug fixes

Fix a bug where incremental parses could get confused about block nesting.

## 0.13.5 (2021-02-11)

### Bug fixes

Fixes an inefficiency in the parsing of large strings.

## 0.13.4 (2021-01-27)

### Bug fixes

Fix a bug where keywords like `else` or `except` would be consumed even if they don't match the indentation of the parent statement.

## 0.13.3 (2021-01-25)

### Bug fixes

Fix an issue where non-indented lines after a colon were parsed as part of the body.

## 0.13.2 (2021-01-19)

### Bug fixes

Add support for return statements without expressions.

## 0.13.1 (2020-12-04)

### Bug fixes

Fix versions of lezer packages depended on.

## 0.13.0 (2020-12-04)

## 0.12.0 (2020-10-23)

### Breaking changes

Adjust to changed serialized parser format.

## 0.11.1 (2020-09-26)

### Bug fixes

Fix lezer depencency versions

## 0.11.0 (2020-09-26)

### Breaking changes

Follow change in serialized parser format.

## 0.10.0 (2020-08-07)

### Breaking changes

Upgrade to 0.10 parser serialization

## 0.9.0 (2020-06-08)

### Breaking changes

Upgrade to 0.9 parser serialization

## 0.8.1 (2020-04-15)

### Bug fixes

Include TypeScript definition file.

Only treat `print` as a keyword when it looks like a Python 2 style print statement.

## 0.8.0 (2020-04-15)

### New Features

First numbered release.
