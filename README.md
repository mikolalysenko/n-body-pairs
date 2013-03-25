n-body-pairs
============
Given a collection of spheres with equal radii, find all pairwise intersections.

Usage
=====
First install using npm:

    npm install n-body-pairs
    
Then use it as follows:

```javascript
//Load the library
var nbp = require("n-body-pairs")

//Create some points
var points = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 100000000],
  [0, 0, 100000001]
]

//Report all pairs of points which are within 1.1 units of eachother
nbp(points, 1.1, function(i,j,d2) {
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

### `nbp(points, radius, callback(a,b,d2)[, storage])`
Computes all pairwise overlaps

* `points` is an array of points
* `radius` is the radius of the overlap query
* `callback(a,b,d2)` is a function which is called on each pair of overlapping points.  If it returns a truthy value, then iteration is terminated.  The parameters are as follows:
    + `a` index of first point
    + `b` index of second point
    + `d2` squared distance between `a` and `b`
* `storage` an optional storage data structure, created using allocateStorage.  If not specified, it is created upon running the algorithm.

**Time Complexity:** `O(points.length * dimension * 2^dimension * log(points.length) + number of intersections)`

**Space Complexity:** Size of storage is `O(points.length * 2^dimension)`

## Storage
To avoid reallocating the array, you can preallocate storage for the data structure.  Here is an example of how to do this:

```javascript
var nbp = require("n-body-pairs")

//Reserve storage for 1000 points in 2D
var storage = nbp.allocateStorage(1000, 2)

//Now call library as usual, but pass storage as extra argument:
nbp([[1, 0, 0],[0,0,1]], 1.0, function(i,j,d2) {},  storage)
```

This avoids reallocating the intermediate arrays needed to solve for collisions

### `nbp.allocateStorage(max_points, dimension)`
Reserves space for an intermediate storage data structure

* `max_points` is the initial capacity of the storage
* `dimension` is the dimension of the point set

**Returns:** A new storage object for resolving the overlap queries

### `nbp.resizeStorage(storage, max_points, dimension)`
Resizes the storage data structure

* `storage` is the data structure to resize
* `max_points` is the new capacity of the storage
* `dimension` is the dimension of the point set

Credits
=======
(c) 2013 Mikola Lysenko. BSD License
