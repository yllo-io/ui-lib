# ui-lib

## Svelte UI Lib

### Installation

1. Install npm package

```
npm i @yllo/ui-lib
```

2. Add scss classes

```
<style lang="scss" global>
    @import '../node_modules/@yllo/ui-lib/UI/theme.scss';
    @import '../node_modules/@yllo/ui-lib/UI/lib.scss';
</style>
```

## Local Launch UI-lib & Dev config

### Local link

1. Open package folder

```
cd package
```

2. Install & Local Link

```
npm install
npm link
```

### Launch

1. Open package folder

```
cd tests
```

2. Install

```
npm install
```

3.  Local Link

```
npm link @yllo/ui-lib
```

4. Start dev server
   (localhost:8080)

```
npm run dev
```
