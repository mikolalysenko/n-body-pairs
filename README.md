n-body-pairs
============
Given a collection of spheres with equal radii, find all pairwise intersections.

Usage
=====
First install using npm:

    npm install n-body-pairs
    
Then use it as follows:

```javascript
//Load the library, allocate initial data structure for searching in 3-dimensions with initial reserve capacity of 1000 points
var nbp = require("n-body-pairs")(3, 1000)

//Create some points
var points = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 100000000],
  [0, 0, 100000001]
]

//Report all pairs of points which are within 0.6 units of eachother
nbp(points, 0.6, function(i,j,d2) {
    console.log("Overlap ("+i+","+j+") Distance=", Math.sqrt(d2), "Positions=", points[i], points[j])
})
//Prints:
//
//  Overlap (0,3) Distance= 1 Positions= [ 0, 0, 0 ] [ 0, 0, 1 ]
//  Overlap (2,0) Distance= 1 Positions= [ 0, 1, 0 ] [ 0, 0, 0 ]
//  Overlap (1,0) Distance= 1 Positions= [ 1, 0, 0 ] [ 0, 0, 0 ]
//  Overlap (4,5) Distance= 1 Positions= [ 0, 0, 100000000 ] [ 0, 0, 100000001 ]
//
```

### `var nbp = require("n-body-pairs")(dimension, capacity)`
Allocates a data structure for performing n-body neighborhood queries.

* `dimension` is the dimension of the space to search in (default 2)
* `capacity` is the initial size of the data structure to reserve (default 1000)

**Storage Complexity:** `O(capacity * 2^dimension)`

### `nbp(points, radius, callback(a,b,d2))`
Computes all pairwise overlaps.  If the data structure does not have sufficient capacity, it is resized.

* `points` is an array of points
* `radius` is the radius of the overlap query
* `callback(a,b,d2)` is a function which is called on each pair of overlapping points.  If it returns a truthy value, then iteration is terminated.  The parameters are as follows:
    + `a` index of first point
    + `b` index of second point
    + `d2` squared distance between `a` and `b`

**Time Complexity:** `O(points.length * dimension * 2^dimension * log(points.length) + number of intersections)`

### `nbp.capacity`
Returns the size of the data structure (set to 0 to free memory.  Set to change the reserve capacity of the data structure.

Credits
=======
(c) 2013 Mikola Lysenko. BSD License
