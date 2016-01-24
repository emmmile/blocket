# Blocket scraper [![Build Status](https://travis-ci.org/emmmile/blocket.svg?branch=master)](https://travis-ci.org/emmmile/blocket)

This application downloads all rent ads for Stockholm from Blocket.se, and shows them on a map.
It is written as a node.js REST application and uses a Neo4j database for storing all the information.

To run it, simply clone the repository and type:
```
npm install
npm start -- --initialize
```

In this way the application is listening on [http://127.0.0.1:3000](http://127.0.0.1:3000) and views something like this:

![](https://raw.githubusercontent.com/emmmile/blocket/master/screenshot.png)

The base route `/blocket/map` expects some parameters for filtering the results.

- the metro line that can be one in `red`, `green`, `blue`, or the name of a line like `T10`, `T11`,  `T13`, `T14`,  `T17`, `T18`,  `T19`. The value `any` can be used to get any line or color.
- the distance in km from the closest metro station. It can also be a decimal like `0.4`. If the distance is 0, no filtering is done, i.e. all ads with some coordinates are returned.
- the maximum price, in SEK/month. If 0 is passed, no filtering is done on the price.
- the maximum age of the ads, in days. If 0 is passed no filtering is done on the age.

I usually use something like [http://127.0.0.1:3000/blocket/map/any/1/10000/0](http://127.0.0.1:3000/blocket/map/any/1/10000/0)

The application also needs a Neo4j database up and running, that can be configuered through `config.js`.
