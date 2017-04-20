var spatStats = require('./index.js')
var fs = require('fs')

// Hey, the  below gives me global Moran's I. Neat!!
console.log("Global Moran's I for Set of Points: ")
console.log(
  spatStats.Moran.Point(JSON.parse(fs.readFileSync('leyteCentroids.geojson')),'val')
)
