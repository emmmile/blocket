# Blocket scraper

This application download all rent ads for Stockholm from Blocket.se, and view them on a map.
It is written as a node.js rest application and uses a Neo4j database for storing all the information.

To run it, simply clone the repository and type:
```
npm install
npm start
```

In this way the application is listening on [http://127.0.0.1:3000](http://127.0.0.1:3000) and views something like this:

![](https://raw.githubusercontent.com/emmmile/blocket/master/screenshot.png)

It expects two parameters:

- `line` that can be one in `red`, `green`, `blue`, or the name of a line like `T10`, `T11`,  `T13`, `T14`,  `T17`, `T18`,  `T19`.
- `distance` that is the distance in km from the closest station.

The application also needs a Neo4j database up and running, that can be configuered through `config.js`.
