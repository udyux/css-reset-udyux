# CSS Reset UdyUX

> My evolving CSS reset, drawing some inspiration from reset.css and normalize among other projects.

## Usage

### Static link

Add the following to your html document's head **before** you link your styles. This will deliver the minified CSS file.

```html
<link rel="stylesheet" type="text/css" href="https://unpkg.com/css-reset-udyux" />
```

### Package import

#### Install

```bash
npm install css-reset-udyux
# or
yarn add css-reset-udyux
```

#### Import

Import the reset from node_modules before you import your styles.

```scss
// in sass
@import '~css-reset-udyux/reset', 'my-styles/come-after';
```
