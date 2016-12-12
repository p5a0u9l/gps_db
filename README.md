# GPS DATA CLIENT and SERVER

#### _DESCRIPTION_

This mini-project implements a simple GPS data-logging system to record position, time, and velocity during my morning and evening commutes from Maple Valley, WA, to Kent, WA, and back. The system additionally provides a client to connect to a remote server for persistent access to GPS logs. Finally, some visualization scripts are provided to display and analyze a sample set of data recorded over several commuter trips.

## Installation

### Dependencies
The node.js package manager [npm](https://www.npmjs.com/) is recommended to install module dependencies and comes with node. [node download](https://nodejs.org/en/download/).

The server database is managed with `sqlite3`

### Install

    $ git clone https://github.com/p5a0u9l/gps_db # clones the repository
    $ cd gps_db
    $ npm install # installs the local module dependencies

### Configuration
`gps_db` comes with a `config.json` file with modifiable entries for

    SERVER_IP, PORT_NUMBER, CLIENT_KEY_FILENAME, DATABASE_NAME

## Usage

### Server

Entering

    $ node server.js

creates a new `sqlite3` database using the path found in `config.json` and binds itself to the configured port.

### Client



## Raspberry Pi Use Case

### GPS Logger Implementation
The data-logging system is implemented on a [Raspberry Pi 3](https://www.raspberrypi.org/products/raspberry-pi-3-model-b/)(RPi) single-board computer, connected via a [USB-TTL adapter](https://www.amazon.com/JBtek%C2%AE-WINDOWS-Supported-Raspberry-Programming/dp/B00QT7LQ88/ref=pd_bxgy_23_img_3?_encoding=UTF8&pd_rd_i=B00QT7LQ88&pd_rd_r=DVMW2MNRZ9JY7Y6295FG&pd_rd_w=j2fIe&pd_rd_wg=3QblB&psc=1&refRID=DVMW2MNRZ9JY7Y6295FG<Paste>) to an [Adafruit Ultimate GPS Breakout](https://www.adafruit.com/product/746) module. The module is built around an [MTK3339 GPS chipset](https://cdn-shop.adafruit.com/datasheets/GlobalTop-FGPMMOPA6H-Datasheet-V0A.pdf) which features a high-sensitivity receiver and an onboard patch antenna. Finally, [gpsd](http://www.catb.org/gpsd/) serves as a monitor and parser of incoming messages and makes them available on a local TCP/IP port for client applications.

### GPS Logger Use-Case
The system is powered-up at the beginning of a trip by connecting to a battery and powered down at the end of the journey by disconnecting the power source. The [10000 mAh battery](https://www.amazon.com/gp/product/B0194WDVHI/ref=oh_aui_search_detailpage?ie=UTF8&psc=1) is intended for mobile recharge of smart phones and will repeatedly power the combined RPi/GPS system for up to 20 30 minute trips. The logging software is wrapped in a `systemd` service that enables it to go into action on bootup and run continuously until losing power.

### Data Download
At the end of each day, the system is connected to a home network via a USB WiFi adapter. A second, very simple `systemd` service is enabled, which is listening for a network connection event. On connection, it synchronizes any on-board GPS logs with a remote server running on [AWS](https://aws.amazon.com/).

### GPS Database
The server manages access to relational database, implemented with a [node.js](https://nodejs.org/en/) API to [sqlite3](https://sqlite.org/) and stores per-client GPS histories. There is a client-side command-line utility on the RPi which can be used for manually putting and getting records from the database via the usage patterns demonstrated below.

