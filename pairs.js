"use strict"

function Storage(max_points, dimension) {
  this.coordinates = new Array(dimension)
  this.points = new Array(dimension)
  for(var i=0; i<dimension; ++i) {
    this.coordinates[i] = new Int32Array(max_points<<dimension)
    this.points[i] = new Float64Array(max_points<<dimension)
  }
  this.indices = new Int32Array(max_points<<dimension)
}

Storage.prototype.resize = function(max_points) {
  var dimension = this.coordinates.length
  for(var i=0; i<dimension; ++i) {
    this.coordinates[i] = new Int32Array(max_points<<dimension)
    this.points[i] = new Float64Array(max_points<<dimension)
  }
  this.indices = new Int32Array(max_points<<dimension)
}

Storage.prototype.size = function() {
  return this.indices >> this.coordinates.length
}

Storage.prototype.move = function(p, q) {
  var coords = this.coordinates
    , points = this.points
    , indices = this.indices
    , dimension = coords.length
    , a, b, k
  for(k=0; k<dimension; ++k) {
    a = coords[k]
    a[p] = a[q]
    b = points[k]
    b[p] = b[q]
  }
  indices[p] = indices[q]
}

Storage.prototype.load = function(scratch, i) {
  var coords = this.coordinates
    , points = this.points
  for(var k=0, d=coords.length; k<d; ++k) {
    scratch[k] = coords[k][i]|0
    scratch[k+d+1] = +points[k][i]
  }
  scratch[d] = this.indices[i]|0
}

Storage.prototype.store = function(i, scratch) {
  var coords = this.coordinates
    , points = this.points
  for(var k=0, d=coords.length; k<d; ++k) {
    coords[k][i] = scratch[k]
    points[k][i] = scratch[k+d+1]
  }
  this.indices[i] = scratch[d]
}

Storage.prototype.swap = function(i, j) {
  var coords = this.coordinates
  var points = this.points
  var ind = this.indices
  var t, a, b
  for(var k=0, d=coords.length; k<d; ++k) {
    a = coords[k]
    t = a[i]
    a[i] = a[j]
    a[j] = t
    b = points[k]
    t = b[i]
    b[i] = b[j]
    b[j] = t
  }
  t = ind[i]
  ind[i] = ind[j]
  ind[j] = t
}

Storage.prototype.compare = function(i,j) {
  var coords = this.coordinates
  for(var k=0, d=coords.length; k<d; ++k) {
    var a = coords[k]
      , s = a[i] - a[j]
    if(s) { return s }
  }
  return this.indices[i] - this.indices[j]
}

Storage.prototype.compareNoId = function(i,j) {
  var coords = this.coordinates
  for(var k=0, d=coords.length-1; k<d; ++k) {
    var a = coords[k]
      , s = a[i] - a[j]
    if(s) { return s }
  }
  return coords[d][i] - coords[d][j]
}

Storage.prototype.compareS = function(i, scratch) {
  var coords = this.coordinates
  for(var k=0, d=coords.length; k<d; ++k) {
    var s = coords[k][i] - scratch[k]
    if(s) { return s }
  }
  return this.indices[i] - scratch[d]
}

/*
  Modified from this: http://stackoverflow.com/questions/8082425/fastest-way-to-sort-32bit-signed-integer-arrays-in-javascript
 */
Storage.prototype.sort = function(n) {
  var coords = this.coordinates
  var points = this.points
  var indices = this.indices
  var dimension = coords.length|0
  var stack = []
  var sp = -1
  var left = 0
  var right = n - 1
  var i, j, k, d, swap = new Array(2*dimension+1), a, b, p, q, t
  for(i=0; i<dimension; ++i) {
    swap[i] = 0|0
  }
  swap[dimension] = 0|0
  for(i=0; i<dimension; ++i) {
    swap[dimension+1+i] = +0.0
  }
  while(true) {
    if(right - left <= 25){
      for(j=left+1; j<=right; j++) {
        for(k=0; k<dimension; ++k) {
          swap[k] = coords[k][j]|0
          swap[k+dimension+1] = +points[k][j]
        }
        swap[dimension] = indices[j]|0
        i = j-1;        
lo_loop:
        while(i >= left) {
          for(k=0; k<dimension; ++k) {
            d = coords[k][i] - swap[k]
            if(d < 0) {
              break lo_loop
            } if(d > 0) {
              break
            }
          }
          p = i+1
          q = i--
          for(k=0; k<dimension; ++k) {
            a = coords[k]
            a[p] = a[q]
            b = points[k]
            b[p] = b[q]
          }
          indices[p] = indices[q]
        }
        this.store(i+1, swap)
      }
      if(sp == -1)    break;
      right = stack[sp--];
      left = stack[sp--];
    } else {
      var median = (left + right) >> 1;
      i = left + 1;
      j = right;
      
      this.swap(median, i)
      if(this.compare(left, right) > 0) {
        this.swap(left, right)
      } if(this.compare(i, right) > 0) {
        this.swap(i, right)
      } if(this.compare(left, i) > 0) {
        this.swap(left, i)
      }
      
      this.load(swap, i)
      while(true){
ii_loop:
        while(true) {
          ++i
          for(k=0; k<dimension; ++k) {
            d = coords[k][i] - swap[k]
            if(d > 0) {
              break ii_loop
            } if(d < 0) {
              continue ii_loop
            }
          }
          if(indices[i] >= swap[dimension]) {
            break
          }
        }
jj_loop:
        while(true) {
          --j
          for(k=0; k<dimension; ++k) {
            d = coords[k][j] - swap[k]
            if(d < 0) {
              break jj_loop
            } if(d > 0) {
              continue jj_loop
            }
          }
          if(indices[j] <= swap[dimension]) {
            break
          }
        }
        if(j < i)    break;
        for(k=0; k<dimension; ++k) {
          a = coords[k]
          t = a[i]
          a[i] = a[j]
          a[j] = t
          b = points[k]
          t = b[i]
          b[i] = b[j]
          b[j] = t
        }
        t = indices[i]
        indices[i] = indices[j]
        indices[j] = t
      }
      this.move(left+1, j)
      this.store(j, swap)
      if(right - i + 1 >= j - left){
        stack[++sp] = i;
        stack[++sp] = right;
        right = j - 1;
      }else{
        stack[++sp] = left;
        stack[++sp] = j - 1;
        left = i;
      }
    }
  }
}

Storage.prototype.hashPoints = function(points, bucketSize, radius) {
  var floor = Math.floor
    , coords = this.coordinates
    , spoints = this.points
    , indices = this.indices
    , count = points.length|0
    , dimension = coords.length|0
    , dbits = (1<<dimension)|0
    , ptr = 0
  for(var i=0; i<count; ++i) {
    var t = ptr
      , p = points[i]
      , cross = 0
    for(var j=0; j<dimension; ++j) {
      var ix = floor(p[j]/bucketSize)
      coords[j][ptr] = ix
      spoints[j][ptr] = p[j]
      if(bucketSize*(ix+1) <= p[j]+2*radius) {
        cross += (1<<j)
      }
    }
    indices[ptr++] = i
    cross = ~cross
    for(var j=1; j<dbits; ++j) {
      if(j & cross) {
        continue
      }
      for(var k=0; k<dimension; ++k) {
        var c = coords[k]
        c[ptr] = c[t]+((j>>>k)&1)
        spoints[k][ptr] = p[k]
      }
      indices[ptr++] = i
    }
  }
  return ptr
}

Storage.prototype.computePairs = function(cellCount, bucketSize, radius, cb) {
  var floor = Math.floor
    , coords = this.coordinates
    , points = this.points
    , indices = this.indices
    , dimension = coords.length|0
    , ptr = 0
    , r2 = 4 * radius * radius
    , i, j, k, l
    , a, b, pa, pb, d, d2, ac, bc
  for(i=0; i<cellCount;) {
    for(j=i+1; j<cellCount; ++j) {
      if(this.compareNoId(i, j) !== 0) {
        break
      }
      a = indices[j]
k_loop:
      for(k=i; k<j; ++k) {
        b = indices[k]
        d2 = 0.0
        for(l=0; l<dimension; ++l) {
          ac = points[l][j]
          bc = points[l][k]
          if(ac > bc) {
            if(coords[l][i] !== floor(ac/bucketSize)) {
              continue k_loop
            }
          } else if(coords[l][i] !== floor(bc/bucketSize)) {
            continue k_loop
          }
          d = ac - bc
          d2 += d * d
          if(d2 > r2) {
            continue k_loop
          }
        }
        if(cb(a, b, d2)) {
          return
        }
      }
    }
    i = j
  }
}

function createNBodyDataStructure(dimension, num_points) {
  dimension = (dimension|0) || 2
  var grid = new Storage(num_points||1024, dimension)
  
  function findPairs(points, radius, cb) {
    var count = points.length|0
    var cellCount = count<<dimension
    if(grid.size() < cellCount) {
      grid.resize(count)
    }
    var bucketSize = 4*radius
    var nc = grid.hashPoints(points, bucketSize, radius)
    grid.sort(nc)
    grid.computePairs(nc, bucketSize, radius, cb)
  }
  
  Object.defineProperty(findPairs, "capacity", {
    get: function() {
      return grid.size()
    },
    set: function(n_capacity) {
      grid.resize(n_points)
      return grid.size()
    }
  })
  
  return findPairs
}

module.exports = createNBodyDataStructure
