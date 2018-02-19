```
_______   ________  ________  ________  _______   ________   ________  ________
|\  ___ \ |\   ____\|\   __  \|\   __  \|\  ___ \ |\   ____\ |\   ____\|\   __  \
\ \   __/|\ \  \___|\ \  \|\  \ \  \|\  \ \   __/|\ \  \___|_\ \  \___|\ \  \|\  \
 \ \  \_|/_\ \_____  \ \   ____\ \   _  _\ \  \_|/_\ \_____  \\ \_____  \ \  \\\  \
  \ \  \_|\ \|____|\  \ \  \___|\ \  \\  \\ \  \_|\ \|____|\  \\|____|\  \ \  \\\  \
   \ \_______\____\_\  \ \__\    \ \__\\ _\\ \_______\____\_\  \ ____\_\  \ \_______\
    \|_______|\_________\|__|     \|__|\|__|\|_______|\_________\\_________\|_______|
             \|_________|                            \|_________\|_________|
```

## A speedy, parallelized, hot-reloading Solidity test framework

Created by [@mertcelebi](https://github.com/mertcelebi) and [@pfletcherhill](https://github.com/pfletcherhill) at [ETHDenver](https://ethdenver.com/).

## Hot-reloading :fire:
![Hot-reloading example](https://thumbs.gfycat.com/HarmoniousAnxiousGnatcatcher-size_restricted.gif)

### Installation

Install packages and run the build script (we prefer using [yarn](https://yarnpkg.com/en/))

```
yarn add espresso-tests --dev
```

### Running tests

```
espresso [--watch] [--fun]
```

### Inspiration

Ethereum solidity development is still in it's early phase. But if you've ever written Solidity before, you know that testing it can be a pain. Truffle does a fine job compiling and deploying Solidity smart contracts, but Truffle's testing framework is slow and usually not helpful. With espresso we're trying to make Solidity testing easier, speedier, and more fun.

### What it does

espresso is a testing framework for Solidity smart contracts, written in Javascript. Features include:

- ✅ Test parallelization
- ✅ Hot-reloading and running of tests (with a --watch flag)
- ✅ Isolated test RPC, so you don't have to have an RPC like ganache running or muddy your development RPC
- ✅ Backwards compatibility with truffle test

### How we built it

espresso is a combination of many tools already being used in development and testing, namely parts of Truffle and Mocha. It relies on the nifty mocha-parallel-tests library for parallelizing the running of test files, and the testing RPC is created using Ganache.

### Challenges we ran into

To list a few:

* Integrating with some of Truffle's internal libraries (i.e. truffle-compile) while still building something new
* Error handling and printing output for tests running in parallel
* Watching arbitrary JS test files and Solidity smart contract files and re-running tests accordingly
* Writing a wrapper around Truffle's config class so we can use truffle.js for projects that have it and generate a valid Truffle config for ones that don't

### Performance

We're just starting to do benchmarking, but the performance thus far has been promising. On a demo folder of Open Zeppelin tests, espresso compiled Solidity, deployed to a test RPC and ran the tests almost twice as fast as Open Zeppelin's implementation of Truffle. Specifically, both successfully completed the 90 tests, with **espresso taking 8.577s and Truffle taking 14.666s**.
