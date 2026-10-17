# playground/

Scratch space. Try things here while working through a lesson:

```sh
node playground/scratch.js
node --print-bytecode --print-bytecode-filter=add playground/scratch.js
```

Files matching `*.local.*` are git-ignored, so `playground/anything.local.js`
is a safe place for throwaway experiments.
