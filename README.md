# elastic-downloader-cli
Download Elastic products from command-line

<p align="center">
  <img src="https://user-images.githubusercontent.com/7076736/177441482-be8c08e4-a0a9-4f4f-a416-7183925e19e0.png">
</p>

## Install
```
npm install -g elastic-downloader-cli
```

## Usage
``` 
ecdl
``` 

> Follow the instructions to download the desired product

## Todo
- [ ] Add auto-extract archive feature (uncompress the archive after the download)
- [ ] Add auto-delete archive feature (delete the archive after uncompressed)
- [ ] Refactor the code
- [ ] Fix the TODO comment to fetch product version (via search-list) rather than relying on 'input'
- [ ] Implement **[yargs](https://github.com/yargs/yargs)** _or_ **[minimist](https://github.com/substack/minimist)** _or_ **[commander](https://github.com/tj/commander.js/)** to allow product download using command-line arguments
- [ ] Extend supported prodcuts / architectures
