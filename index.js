var distance = require("@turf/distance")
var mathjs = require("mathjs")
/**
 * @param {FeatureCollection|MultPoint} geoJSON
 * @param {String} value
 */

function Moran() {};

Moran.globPoint = function(geoJSON, value) {

  // Moran's I for Points. spatial weights are based on inverse distnace
  //
  //    Equation:
  //      I = (N / ΣiΣjWij) x (ΣiΣjWij(Xi-Xmean)(Xj-Xmean) / Σi(Xi-Xbar)^2)
  //      Where:
  //         N = number of observations (points)
  //         ΣiΣjWij = sum of a spatial weights matrix, where spatial weight
  //                   here is defined by inverse distance
  //                  (such that closer things have more influence)
  //         ΣiΣjWij(Xi-Xmean)(Xj-Xmean) = sum of weighted cross product matrix.
  //                                       A matrix where very i,j pair represents
  //                                       an observation's deviation from the mean
  //                                       mutiplied by one of its neighbors' Deviation
  //                                       from the mean, weighted, or multiplied
  //                                       by the spatial weight from obserbation j on i
  //         Σi(Xi-Xbar)^2) = sum of squared devations from the mean.
  //
  //    Code Steps:
  //      1. Calculate the Matricies and array we need
  //        - Spatial Weigths Matrix
  //        - Cross Product Matrix
  //        - Squared Deviations Array
  //      2. Calculate the first term (N/Spatial Weights Matrix)
  //      3. Calculate the second term (Spatially Weigthed Cross Product)/Deviation Matrix
  //      4. Caclulate Global Moran's I (first term * second term)
  //
  //
  // Step 1.
  // generate Matricies and Array
  WeightedCrossProdMatrix = []
  SpatialWeightMatrix = []
  DeviationArray = []
  mean = mathjs.mean(geoJSON.features.map(function(d){return d.properties[value]}))
  // for each feature observation...
  geoJSON.features.forEach(function(d) {
    rowWCPM = []
    rowSWM = []
    yIyBar = d.properties[value]-mean
    // add the squared deviation to the DeviationArray
    DeviationArray.push(mathjs.square(yIyBar))
    // generate rows for the SpatialWeight & WeightedCrossProduct Matricies
    for(i=0;i<geoJSON.features.length;i++) {
      // if geoJSON.features[i] is d (Xi), add a 0!!
      if(d===geoJSON.features[i]){
        rowWCPM.push(0)
        rowSWM.push(0)
      } else {
        // generate InverseDistance. Thanks turf.js! You're the best!
        InverseDistance = 1/distance(d,geoJSON.features[i],'miles')
        // generate Xi's neighbor, Xj's deviation, from the mean
        yJyBar = geoJSON.features[i].properties[value]-mean
        // make zIzJ, the cross product of Xi and it's neighbor Xj
        zIzJ = yIyBar * yJyBar
        // push zIzJ, weighted by InverseDistance, to Xi's WeightedCrossProdMatrix row
        rowWCPM.push(zIzJ * InverseDistance)
        // push Xj's InverseDistance to Xi to Xi's SpatialWeightMatrix row
        rowSWM.push(InverseDistance)
      }
    }
    // once we've found weighted cross prodcuts and inverse distnace for
    // all neighbors, push Xi's rows to the matricies
    WeightedCrossProdMatrix.push(rowWCPM)
    SpatialWeightMatrix.push(rowSWM)
  })

  // calculate the first term
  nOverSumSpatWeights = (geoJSON.features.length)/mathjs.sum(SpatialWeightMatrix)
  // calculate the second term
  wcpmOverSumDevArray = mathjs.sum(WeightedCrossProdMatrix)/mathjs.sum(DeviationArray)
  // make that Moran's I!!
  moranI = mathjs.multiply(nOverSumSpatWeights,wcpmOverSumDevArray)
  // return Moran's I
  return moranI
}

exports.Moran = Moran;
