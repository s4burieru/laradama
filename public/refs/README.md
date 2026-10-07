# Reference images for custom scans

Drop image files here (e.g. `rene-1.png`) and list them in
`src/data/customMatches.js` under an entry's `refImages`:

```js
refImages: ['/refs/rene-1.png'],
```

Uploads are then compared against these with a perceptual hash **before** any
API call, so an exact or near-duplicate upload is recognized offline and
instantly. Keyword recognition in `src/data/customMatches.js` still runs as the
backstop for photos you never uploaded here.
