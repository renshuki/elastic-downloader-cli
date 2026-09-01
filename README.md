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

Interactive mode:
``` 
ecdl
``` 

> Follow the instructions to download the desired product

Non-interactive mode:
```
ecdl --product elasticsearch --arch linux-x86_64 --product-version 8.14.0 --yes
```

Options can also be combined with the interactive prompts: whatever is not passed on the command line will be asked interactively.

```
  -p, --product <product>            product to download, by slug (see --list-products)
  -a, --arch <arch>                  architecture / package id (see --list-products)
  -v, --product-version <version>    product version to download
  --extract                          extract the archive after the download
  --delete-archive                   delete the archive once extracted (implies --extract)
  -y, --yes                          skip the confirmation prompt
  --list-products                    list the available products and architectures, then exit
  -V, --cli-version                  output the elastic-downloader-cli version
  -h, --help                         display help for command
```

## Supported products

- **Elastic Stack**: Elasticsearch, Kibana, Logstash
- **Elastic Observability**: Elastic Agent, APM Server, Auditbeat, Filebeat, Functionbeat, Heartbeat, Journalbeat, Metricbeat, Packetbeat, Winlogbeat, Topbeat (legacy)
- **Elastic Enterprise Search**: App Search (7.0 to 7.6), Enterprise Search (7.7 to 8.x)
- **Tools and clients**: Elasticsearch for Apache Hadoop, Elasticsearch SQL ODBC Driver, X-Pack (5.0 to 6.2)
- **OSS distributions** (Apache 2.0, 6.3 to 7.10): Elasticsearch OSS, Kibana OSS, Logstash OSS, APM Server OSS, Auditbeat OSS, Filebeat OSS, Heartbeat OSS, Journalbeat OSS, Metricbeat OSS, Packetbeat OSS, Winlogbeat OSS (Functionbeat never shipped an OSS variant)

Available packages: `tar.gz` (Linux x86_64 / aarch64 / arm64, macOS Intel / Apple Silicon, and platform independent for App Search / Enterprise Search), `zip` (Windows 64-bit / 32-bit, and platform independent for Elasticsearch for Apache Hadoop / X-Pack), `tgz` (legacy Topbeat for macOS), `deb` (amd64 / arm64, plus legacy i386), `rpm` (x86_64 / aarch64, plus legacy i686) and `msi` (ODBC driver, 64 / 32-bit). Architecture choices are filtered per product, and version-specific filename schemes (e.g. Elasticsearch before 7.0.0 or Logstash before 7.10.0 not embedding the architecture) are handled automatically.

## Todo
- [x] Add auto-extract archive feature (uncompress the archive after the download)
- [x] Add auto-delete archive feature (delete the archive after uncompressed)
- [x] Refactor the code
- [x] Fix the TODO comment to fetch product version (via search-list) rather than relying on 'input'
- [x] Implement **[commander](https://github.com/tj/commander.js/)** to allow product download using command-line arguments
- [x] Extend supported products / architectures
