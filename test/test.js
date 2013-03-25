var nbp = require("../pairs.js")

require("tap").test("n-body-pairs", function(t) {
  //Create some points
  var points = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [0, 0, 100000000],
    [0, 0, 100000001]
  ]

  //Report all pairs of points which are within 1.5 units of eachother
  var pairs = []
  nbp(points, 1.1, function(i,j) {
    console.log("Overlap ("+i+","+j+"):", points[i], points[j])
    pairs.push([Math.min(i,j), Math.max(i,j)])
  })
  pairs.sort()
  t.equals(pairs.join("|"),  [[ 0, 1 ], [ 0, 2 ], [ 0, 3 ], [ 4, 5 ]].join("|"))

  t.end()
})