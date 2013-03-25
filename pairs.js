"use strict"

function allocateGrid(max_points, dimension) {
  max_points = max_points|0
  dimension = dimension|0
  var grid = new Array(max_points<<dimension)
  for(var i=0, len=grid.length; i<len; ++i) {
    var g = new Array(dimension+1)
    for(var j=0; j<=dimension; ++j) {
      g[j] = 0
    }
    grid[i] = g
  }
  return grid
}

function resizeGrid(grid, max_points, dimension) {
  if(grid.length > 0) {
    dimension = (grid[0].length-1)|0
  }
  var nlen = max_points<<dimension
  if(nlen < grid.length) {
    grid.length = nlen
  } else {
    var plen = grid.length
    grid.length=nlen
    for(var i=plen; i<nlen; ++i) {
      var g = new Array(dimension+1)
      for(var j=0; j<=dimension; ++j) {
        g[j] = 0
      }
      grid[i] = g
    }
  }
  return grid
}

function compareLex(a, b) {
  for(var i=0, len=a.length-1; i<len; ++i) {
    var d = a[i] - b[i]
    if(d) { return d }
  }
  return 0
}

function findPairs_impl(points, count, dimension, radius, cb, grid, compareFun) {
  var floor = Math.floor
    , dbits = 1<<dimension
    , ptr = 0
  for(var i=0; i<count; ++i) {
    var c = grid[ptr++]
      , p = points[i]
    for(var j=0; j<dimension; ++j) {
      c[j] = floor(p[j]/radius)|0
    }
    c[dimension]=i
    for(var j=1; j<dbits; ++j) {
      var g = grid[ptr++]
      for(var k=0; k<dimension; ++k) {
        g[k] = (c[k]+((j>>>k)&1))|0
      }
      g[dimension]=i
    }
  }
  grid.sort(compareFun)
  var r2 = radius * radius
  for(var i=0, len=grid.length; i<len; ++i) {
    var cs = grid[i]
    var j=i
j_loop:
    while(++j < len) {
      var as = grid[j]
      for(var k=0; k<dimension; ++k) {
        if(as[k] !== cs[k]) {
          break j_loop
        }
      }
      var a = as[dimension]
      var pa = points[a]
k_loop:
      for(var k=i; k<j; ++k) {
        var b = grid[k][dimension]
        //Check if the coordinate is lexicographically first intersection
        var pb = points[b]
        var d2 = 0.0
        for(var l=0; l<dimension; ++l) {
          var ac = pa[l]
          var bc = pb[l]
          var d = ac - bc
          if(d >= 0) {
            if(cs[l] !== (floor(pa[l]/radius)|0)) {
              continue k_loop
            }
          } else if(cs[l] !== (floor(pb[l]/radius)|0)) {
            continue k_loop
          }
          d2 += d * d
        }
        //Then check if l2 bound holds
        if(d2 <= r2) {
          if(cb(a, b)) {
            return
          }
        }
      }
    }
    i = j
  }
}

function findPairs(points, radius, cb, grid) {
  if(points.length === 0) {
    return
  }
  var count = points.length|0
  var dimension = points[0].length|0
  if(!grid) {
    grid = allocateGrid(count, dimension)
  } else if(grid.length < (count<<dimension)) {
    reserveGrid(grid, count, dimension)
  }
  findPairs_impl(points, count, dimension, radius, cb, grid, compareLex)
}

module.exports = findPairs
module.exports.allocateStorage = allocateGrid
module.exports.resizeStorage = resizeGrid