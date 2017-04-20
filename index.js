var distance = require("@turf/distance")
var mathjs = require("mathjs")
// for distance based weight matrix
// -> http://www.stat.purdue.edu/~bacraig/SCS/Spatial%20Correlation%20new.doc
// for adjacency based weiht matrix
// ->
/**
 * @param {FeatureCollection|MultPoint} geoJSON
 * @param {String} value
 */

function Moran() {};

Moran.Point = function(geoJSON, value) {

  // Moran's I for Points. spatial weights are based on inverse distnace
  //
  //    Steps:
  //      1. Calculate Spatial Weight's Matrix
  //      2. Standardize Dataset per mean & stdev
  //      3. use matrix and standard dataset to get Moran's
  //
  //
  // Step 1.
  // generate matrix with rows representing inverse distances
  // between each point d and all other points, including itself
  // creates a matrix like :
  // |00 .5 .1|
  // |.5 00 .5|
  // |.1 .5 00|
  SpatWeightMatrix = []
  geoJSON.features.forEach(function(d) {
    row = []
    for(i=0;i<geoJSON.features.length;i++) {
      if(d===geoJSON.features[i]){weightedInverseDist=0} else {
        weightedInverseDist = 1/distance(d,geoJSON.features[i],'kilometers')
      }
      row.push(weightedInverseDist)
    }
    SpatWeightMatrix.push(row)
  })

  SpatWeightMatrix = mathjs.matrix(SpatWeightMatrix)
  // Step 2.
  // normalize property values from d to z where z = (d-mean)/standardDeviation
  valueArray = geoJSON.features.map(function(d){return d.properties[value]})
  mean = mathjs.mean(valueArray)
  stdev = mathjs.std(valueArray)
  valueArray = valueArray.map(function(d){return (d-mean)/stdev})
  // Step 3.
  // return the matrix multiplication of the valueArray & (valueArray * spatialWeightMatrix)
  return mathjs.multiply(valueArray,mathjs.multiply(valueArray,SpatWeightMatrix))
}

exports.Moran = Moran;
